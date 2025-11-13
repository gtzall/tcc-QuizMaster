import { NextResponse } from 'next/server'

// In-memory lobby store
interface Player { id: string; name: string; avatar: string }
interface Lobby {
  id: string
  name: string
  isPrivate: boolean
  password?: string
  maxPlayers: number
  players: Player[]
  leaderId: string
  createdAt: number
  open: boolean
  inviteCode: string
}

declare global {
  // eslint-disable-next-line no-var
  var __LOBBIES__: Map<string, Lobby> | undefined
}

const lobbies = (globalThis.__LOBBIES__ ||= new Map<string, Lobby>())

const randomId = () => Math.random().toString(36).slice(2, 10)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const openOnly = url.searchParams.get('open') === 'true'
  const code = url.searchParams.get('code') || ''

  const list = Array.from(lobbies.values())
    .filter(l => (openOnly ? l.open && !l.isPrivate : true))
    .filter(l => (code ? l.inviteCode === code : true))
    .filter(l => (q ? l.name.toLowerCase().includes(q) : true))
    .map(l => ({
      id: l.id,
      name: l.name,
      isPrivate: l.isPrivate,
      maxPlayers: l.maxPlayers,
      players: l.players,
      leaderId: l.leaderId,
      open: l.open,
      inviteCode: l.inviteCode,
      createdAt: l.createdAt,
    }))

  return NextResponse.json({ lobbies: list })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const name = String(body.name || 'Equipe')
  const isPrivate = Boolean(body.isPrivate)
  const password = isPrivate ? String(body.password || '') : undefined
  const maxPlayers = Math.max(2, Math.min(12, Number(body.maxPlayers || 6)))
  const leader: Player = body.leader || { id: randomId(), name: 'Líder', avatar: `/api/placeholder/40/40` }

  const id = randomId()
  const inviteCode = randomId() + randomId()

  const lobby: Lobby = {
    id,
    name,
    isPrivate,
    password,
    maxPlayers,
    players: [leader],
    leaderId: leader.id,
    createdAt: Date.now(),
    open: true,
    inviteCode,
  }

  lobbies.set(id, lobby)
  return NextResponse.json(lobby, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { action, lobbyId } = body
  const lobby = lobbies.get(String(lobbyId))
  if (!lobby) return NextResponse.json({ error: 'Lobby não encontrado' }, { status: 404 })

  if (action === 'join') {
    const player = body.player as Player
    const password = String(body.password || '')
    if (lobby.isPrivate && lobby.password !== password) {
      return NextResponse.json({ error: 'Senha inválida' }, { status: 403 })
    }
    if (lobby.players.find(p => p.id === player.id)) {
      return NextResponse.json(lobby)
    }
    if (lobby.players.length >= lobby.maxPlayers) {
      return NextResponse.json({ error: 'Lobby cheio' }, { status: 409 })
    }
    lobby.players.push(player)
    lobbies.set(lobby.id, lobby)
    return NextResponse.json(lobby)
  }

  if (action === 'leave') {
    const playerId = String(body.playerId || '')
    lobby.players = lobby.players.filter(p => p.id !== playerId)
    if (!lobby.players.find(p => p.id === lobby.leaderId) && lobby.players.length) {
      lobby.leaderId = lobby.players[0].id
    }
    lobbies.set(lobby.id, lobby)
    return NextResponse.json(lobby)
  }

  if (action === 'update') {
    const leaderId = String(body.leaderId || '')
    if (leaderId !== lobby.leaderId) {
      return NextResponse.json({ error: 'Apenas o líder pode atualizar' }, { status: 403 })
    }
    if (typeof body.name === 'string') lobby.name = body.name
    if (typeof body.isPrivate === 'boolean') lobby.isPrivate = body.isPrivate
    if (typeof body.password === 'string') lobby.password = body.password
    if (typeof body.maxPlayers === 'number') lobby.maxPlayers = Math.max(2, Math.min(12, body.maxPlayers))
    if (typeof body.open === 'boolean') lobby.open = body.open
    lobbies.set(lobby.id, lobby)
    return NextResponse.json(lobby)
  }

  if (action === 'kick') {
    const leaderId = String(body.leaderId || '')
    const targetId = String(body.targetId || '')
    if (leaderId !== lobby.leaderId) {
      return NextResponse.json({ error: 'Apenas o líder pode expulsar' }, { status: 403 })
    }
    lobby.players = lobby.players.filter(p => p.id !== targetId)
    lobbies.set(lobby.id, lobby)
    return NextResponse.json(lobby)
  }

  if (action === 'toggle-open') {
    const leaderId = String(body.leaderId || '')
    if (leaderId !== lobby.leaderId) {
      return NextResponse.json({ error: 'Apenas o líder pode alterar' }, { status: 403 })
    }
    lobby.open = !lobby.open
    lobbies.set(lobby.id, lobby)
    return NextResponse.json(lobby)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const lobbyId = url.searchParams.get('lobbyId') || ''
  if (!lobbies.has(lobbyId)) return NextResponse.json({ ok: true })
  lobbies.delete(lobbyId)
  return NextResponse.json({ ok: true })
}
