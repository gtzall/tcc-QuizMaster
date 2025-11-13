"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Ghost, Clock, Trophy, Home, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiQuestion {
  id?: string
  enunciado: string
  alternativas: string[]
  respostaCorreta: number
  subject?: string
  tema?: string
  explicacao?: string
}

type DifficultyKey = "facil" | "medio" | "dificil"

interface Player {
  id: string
  name: string
  avatar?: string
  eliminated: boolean
}

const DIFF_BY_STAGE: DifficultyKey[] = [
  "facil","facil","facil",
  "medio","medio","medio",
  "dificil","dificil","dificil",
]

export default function SurvivalMode() {
  const [stage, setStage] = useState(1)
  const [players, setPlayers] = useState<Player[]>(() => {
    const base: Player[] = [
      { id: "you", name: "Você", eliminated: false },
      { id: "p1", name: "Lia", eliminated: false },
      { id: "p2", name: "Kai", eliminated: false },
      { id: "p3", name: "Noah", eliminated: false },
      { id: "p4", name: "Ivy", eliminated: false },
      { id: "p5", name: "Ravi", eliminated: false },
      { id: "p6", name: "Maya", eliminated: false },
      { id: "p7", name: "Leo", eliminated: false },
    ]
    return base
  })
  const [question, setQuestion] = useState<ApiQuestion | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [time, setTime] = useState(20)
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState<"victory"|"defeat"|null>(null)

  const aliveCount = players.filter(p => !p.eliminated).length
  const you = players.find(p=>p.id==="you")!

  const difficulty: DifficultyKey = useMemo(() => {
    const idx = Math.min(DIFF_BY_STAGE.length - 1, stage - 1)
    return DIFF_BY_STAGE[idx]
  }, [stage])

  const bgClass = useMemo(() => {
    // Different visual per stage
    const ring = stage % 3
    if (ring === 1) return "from-gray-900 via-indigo-900 to-fuchsia-900"
    if (ring === 2) return "from-gray-900 via-cyan-900 to-emerald-900"
    return "from-gray-900 via-rose-900 to-purple-900"
  }, [stage])

  const getUsedIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem('usedQuestionIds')||'[]') as string[] } catch { return [] }
  }
  const addUsedIds = (ids: string[]) => {
    try {
      const used = new Set<string>(getUsedIds())
      ids.forEach(id=>id && used.add(String(id)))
      localStorage.setItem('usedQuestionIds', JSON.stringify(Array.from(used)))
    } catch {}
  }

  const fetchQuestion = async () => {
    setLoading(true)
    try {
      const used = getUsedIds()
      const params = new URLSearchParams()
      params.set('difficulty', difficulty)
      if (used.length) params.set('exclude', used.join(','))
      const res = await fetch(`/api/questions?${params.toString()}`)
      const data = await res.json()
      const pool: ApiQuestion[] = Array.isArray(data[difficulty]) ? data[difficulty] : []
      const shuffled = [...pool].sort(()=>0.5-Math.random())
      const pick = shuffled[0]
      setQuestion(pick || null)
      if (pick?.id) addUsedIds([String(pick.id)])
      setSelected(null)
      setTime(Math.max(8, 20 - Math.floor(stage/2)))
    } catch {
      setQuestion(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ fetchQuestion() }, [difficulty])

  // timer
  useEffect(()=>{
    if (!question || finished) return
    const id = setInterval(()=>{
      setTime(t=>{
        if (t<=1){
          onAnswer(-1)
          return 0
        }
        return t-1
      })
    },1000)
    return ()=>clearInterval(id)
  },[question, finished])

  const eliminateOthers = () => {
    setPlayers(prev => {
      const alive = prev.filter(p=>!p.eliminated && p.id!=="you")
      // eliminate 1-2 at random depending on stage
      const toEliminate = Math.min(alive.length, 1 + (stage>4 ? 1 : 0))
      const shuffled = [...alive].sort(()=>0.5-Math.random())
      const targets = new Set(shuffled.slice(0,toEliminate).map(p=>p.id))
      return prev.map(p => targets.has(p.id) ? { ...p, eliminated: true } : p)
    })
  }

  const onAnswer = (idx: number) => {
    if (!question || selected!==null || finished) return
    setSelected(idx)
    const correct = idx === question.respostaCorreta
    if (!correct){
      // you eliminated
      setPlayers(prev => prev.map(p=> p.id==="you" ? { ...p, eliminated: true } : p))
      setFinished("defeat")
      return
    }
    // correct -> proceed
    eliminateOthers()
    setTimeout(()=>{
      if (aliveCount-1 <= 1){ // you + last
        setFinished("victory")
      } else {
        setStage(s=>s+1)
      }
    }, 600)
  }

  if (finished){
    return (
      <div className={cn("min-h-screen text-white bg-gradient-to-br", bgClass)}>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
            {finished==="victory" ? <Trophy className="w-10 h-10 text-yellow-400"/> : <ShieldAlert className="w-10 h-10 text-red-400"/>}
          </div>
          <h1 className="text-4xl font-extrabold mb-2">{finished==="victory"?"Você venceu!":"Eliminado"}</h1>
          <p className="text-gray-300 mb-8">Modo Survival • Estágio {stage}</p>
          <Button onClick={()=>{ window.location.href='/battle' }} variant="outline" className="border-gray-600 text-gray-300">Voltar à Arena</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen text-white bg-gradient-to-br", bgClass)}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button onClick={()=>{ window.location.href='/battle' }} variant="ghost" className="text-gray-300 hover:text-white"> <Home className="w-4 h-4 mr-2"/> Voltar</Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-red-400"/> <span className="font-mono">{time}s</span></div>
            <Badge className="bg-blue-600">Estágio {stage}</Badge>
            <Badge className="bg-emerald-600">Vivos {aliveCount}</Badge>
            <Badge className="bg-pink-600 capitalize">{difficulty}</Badge>
          </div>
        </div>

        {/* Players bar */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
          {players.map((p)=> (
            <div key={p.id} className={cn("flex items-center gap-2 px-2 py-1 rounded-lg border", p.eliminated?"border-gray-700 bg-gray-800/40":"border-gray-600 bg-gray-800/70")}> 
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 overflow-hidden">
                {p.eliminated ? (
                  <Ghost className="w-5 h-5 text-gray-400"/>
                ) : (
                  <span className="text-xs">{p.name.slice(0,2).toUpperCase()}</span>
                )}
              </div>
              <div className="text-xs truncate">
                <span className={cn("block", p.eliminated?"line-through text-gray-400":"text-white")}>{p.name}</span>
                {p.eliminated && <span className="text-[10px] text-gray-400">Eliminado</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="bg-black/20 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Questão do Estágio {stage}</h2>
            <span className="text-sm text-gray-300">Responda para sobreviver</span>
          </div>

          {loading || !question ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Carregando...</div>
          ) : (
            <>
              <p className="text-gray-100 mb-4">{question.enunciado}</p>
              <div className="grid grid-cols-1 gap-3">
                {question.alternativas.map((alt, i)=> (
                  <button
                    key={i}
                    disabled={selected!==null}
                    onClick={()=>onAnswer(i)}
                    className={cn(
                      "text-left rounded-xl px-4 py-3 border transition",
                      selected===null && "hover:scale-[1.01] hover:border-blue-500/40",
                      selected!==null && i===question.respostaCorreta && "border-emerald-500 bg-emerald-500/10",
                      selected!==null && selected===i && selected!==question.respostaCorreta && "border-rose-500 bg-rose-500/10",
                      selected===null && "border-white/10 bg-white/5",
                    )}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
