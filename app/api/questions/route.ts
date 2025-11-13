import { NextResponse } from "next/server"
import { promises as fs } from 'fs'
import path from 'path'
import {
  allQuestions as compiledQuestions,
  QuizQuestion
} from '@/lib/quiz-data'
import { subjectQuestions } from '@/lib/subject-questions'

const questionsFilePath = path.join(process.cwd(), 'lib', 'questions.json')

async function readQuestionsFile() {
  try {
    const fileContents = await fs.readFile(questionsFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading questions file:', error)
    return { facil: [], medio: [], dificil: [] }
  }
}

async function writeQuestionsFile(data: any) {
  try {
    await fs.writeFile(questionsFilePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing questions file:', error)
    return false
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filterSubject = url.searchParams.get('subject') || undefined
  const filterTopic = url.searchParams.get('topic') || undefined
  const filterDiff = url.searchParams.get('difficulty') as ('facil' | 'medio' | 'dificil' | null)
  const excludeParam = url.searchParams.get('exclude') || ''
  const exclude = new Set(excludeParam.split(',').map(s => s.trim()).filter(Boolean))
  const data = await readQuestionsFile()

  const ensureArray = (x: any) => Array.isArray(x) ? x : []
  let facil = ensureArray(data.facil)
  let medio = ensureArray(data.medio)
  let dificil = ensureArray(data.dificil)

  const areas = new Set(['Provas','Cursos','Programas','Escola','Universidades','Estatísticas'])

  const hashId = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0 }
    return 'q_' + Math.abs(h).toString(36)
  }

  const mapCompiled = (q: QuizQuestion) => ({
    id: hashId(`${q.subject}|${q.topic}|${q.question}|${q.correctAnswer}`),
    enunciado: q.question,
    alternativas: q.options,
    respostaCorreta: q.correctAnswer,
    tema: q.topic,
    explicacao: q.explanation,
    subject: q.subject,
    area: areas.has(q.topic) ? q.topic : undefined,
  })

  const fromSubjects = Object.values(subjectQuestions).flat().map((q) => ({
    id: hashId(`${q.subject}|${q.topic}|${q.question}|${q.correctAnswer}`),
    enunciado: q.question,
    alternativas: q.options,
    respostaCorreta: q.correctAnswer,
    tema: q.topic,
    explicacao: q.explanation,
    subject: q.subject,
    area: areas.has(q.topic) ? q.topic : undefined,
    dificuldade: q.difficulty,
  }))

  const compiledByDiff = {
    facil: compiledQuestions.filter(q => q.difficulty === 'facil').map(mapCompiled),
    medio: compiledQuestions.filter(q => q.difficulty === 'medio').map(mapCompiled),
    dificil: compiledQuestions.filter(q => q.difficulty === 'dificil').map(mapCompiled),
  }

  // No duplication padding: always return unique items only
  const uniqueById = (arr: any[]) => {
    const seen = new Set<string>()
    return arr.filter((q) => {
      const id = String(q.id ?? hashId(`${q.subject}|${q.tema}|${q.enunciado}|${q.respostaCorreta}`))
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  // Merge with compiled pools to increase availability, then enforce uniqueness
  facil = uniqueById([
    ...facil,
    ...compiledByDiff.facil,
    ...fromSubjects.filter(q => q.dificuldade === 'facil')
  ])
  medio = uniqueById([
    ...medio,
    ...compiledByDiff.medio,
    ...fromSubjects.filter(q => q.dificuldade === 'medio')
  ])
  dificil = uniqueById([
    ...dificil,
    ...compiledByDiff.dificil,
    ...fromSubjects.filter(q => q.dificuldade === 'dificil')
  ])

  // Map area for existing items
  const mapArea = (q: any) => ({
    id: q.id ?? hashId(`${q.subject}|${q.tema}|${q.enunciado}|${q.respostaCorreta}`),
    ...q,
    area: q.area ?? (areas.has(q.tema) ? q.tema : undefined)
  })

  const byExclude = (arr: any[]) => arr.filter(q => !exclude.has(String(q.id)))

  const payload = {
    facil: byExclude(facil.map(mapArea)),
    medio: byExclude(medio.map(mapArea)),
    dificil: byExclude(dificil.map(mapArea))
  }

  if (!filterSubject && !filterTopic && !filterDiff) {
    return NextResponse.json(payload)
  }

  const applyFilters = (arr: any[]) => arr.filter((q) => {
    if (filterSubject && q.subject !== filterSubject) return false
    if (filterTopic && q.tema !== filterTopic) return false
    return true
  })

  const filtered = {
    facil: filterDiff && filterDiff !== 'facil' ? [] : applyFilters(payload.facil),
    medio: filterDiff && filterDiff !== 'medio' ? [] : applyFilters(payload.medio),
    dificil: filterDiff && filterDiff !== 'dificil' ? [] : applyFilters(payload.dificil)
  }

  return NextResponse.json({
    facil: filtered.facil,
    medio: filtered.medio,
    dificil: filtered.dificil
  })
}

export async function POST(request: Request) {
  try {
    const newQuestion = await request.json()
    const questionsData = await readQuestionsFile()
    
    // Adicionar nova questão na categoria de dificuldade apropriada
    if (!questionsData[newQuestion.dificuldade]) {
      questionsData[newQuestion.dificuldade] = []
    }
    
    questionsData[newQuestion.dificuldade].push({
      enunciado: newQuestion.enunciado,
      alternativas: newQuestion.alternativas,
      respostaCorreta: newQuestion.respostaCorreta,
      tema: newQuestion.tema,
      explicacao: newQuestion.explicacao
    })
    
    const success = await writeQuestionsFile(questionsData)
    
    if (success) {
      return NextResponse.json({ message: 'Questão criada com sucesso' }, { status: 201 })
    } else {
      return NextResponse.json({ error: 'Erro ao salvar questão' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}


