"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  Users, Shield, Unlock, Lock, Search, Copy, Crown, UserMinus, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Player { id: string; name: string; avatar?: string }
interface LobbyItem { id: string; name: string; isPrivate: boolean; maxPlayers: number; players: Player[]; leaderId: string; open: boolean; inviteCode: string; createdAt: number }

function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null)
  useEffect(()=>{
    const saved = localStorage.getItem('player')
    if (saved) setPlayer(JSON.parse(saved))
    else {
      const id = Math.random().toString(36).slice(2,10)
      const p = { id, name: `Jogador_${id}` }
      localStorage.setItem('player', JSON.stringify(p))
      setPlayer(p)
    }
  },[])
  return { player, setPlayer }
}

export default function TeamConquestLobby(){
  const { player } = usePlayer()
  const [list, setList] = useState<LobbyItem[]>([])
  const [query, setQuery] = useState("")
  const [openOnly, setOpenOnly] = useState(true)
  const [creating, setCreating] = useState(false)
  const [myLobby, setMyLobby] = useState<LobbyItem | null>(null)

  // create form
  const [name, setName] = useState("Equipe Nova")
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(6)

  const fetchList = async () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (openOnly) params.set('open', 'true')
    const res = await fetch(`/api/lobbies?${params.toString()}`)
    const data = await res.json()
    setList(data.lobbies || [])
  }

  const refreshMyLobby = async () => {
    const id = localStorage.getItem('currentLobbyId')
    if (!id) { setMyLobby(null); return }
    const res = await fetch(`/api/lobbies`)
    const data = await res.json()
    const found: LobbyItem | undefined = (data.lobbies || []).find((l: LobbyItem)=>l.id===id)
    setMyLobby(found || null)
    if (!found) localStorage.removeItem('currentLobbyId')
  }

  useEffect(()=>{ fetchList() }, [query, openOnly])
  useEffect(()=>{ refreshMyLobby() }, [])

  const createLobby = async () => {
    if (!player) return
    setCreating(true)
    try{
      const res = await fetch('/api/lobbies', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, isPrivate, password, maxPlayers, leader: player })
      })
      const lobby: LobbyItem = await res.json()
      localStorage.setItem('currentLobbyId', lobby.id)
      await refreshMyLobby()
      await fetchList()
    } finally {
      setCreating(false)
    }
  }

  const joinLobby = async (lobby: LobbyItem) => {
    if (!player) return
    let pwd = ""
    if (lobby.isPrivate){
      pwd = prompt('Senha da equipe') || ''
    }
    const res = await fetch('/api/lobbies', {
      method:"PATCH",
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'join', lobbyId: lobby.id, player, password: pwd })
    })
    const data = await res.json()
    if (!data.error){
      localStorage.setItem('currentLobbyId', lobby.id)
      setMyLobby(data)
      await fetchList()
    }
  }

  const leaveLobby = async () => {
    if (!player || !myLobby) return
    const res = await fetch('/api/lobbies', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'leave', lobbyId: myLobby.id, playerId: player.id })
    })
    const data = await res.json()
    localStorage.removeItem('currentLobbyId')
    setMyLobby(null)
    await fetchList()
  }

  const isLeader = myLobby && player && myLobby.leaderId === player.id

  const updateLobby = async (patch: Partial<LobbyItem> & { password?: string }) => {
    if (!myLobby || !player) return
    const res = await fetch('/api/lobbies', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'update', lobbyId: myLobby.id, leaderId: player.id, ...patch })
    })
    const data = await res.json()
    if (!data.error){ setMyLobby(data); await fetchList() }
  }

  const kick = async (id: string) => {
    if (!myLobby || !player) return
    await fetch('/api/lobbies', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'kick', lobbyId: myLobby.id, leaderId: player.id, targetId: id })
    })
    await refreshMyLobby(); await fetchList()
  }

  const toggleOpen = async () => {
    if (!myLobby || !player) return
    const res = await fetch('/api/lobbies', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'toggle-open', lobbyId: myLobby.id, leaderId: player.id })
    })
    const data = await res.json(); if (!data.error) setMyLobby(data)
  }

  const destroy = async () => {
    if (!myLobby) return
    await fetch(`/api/lobbies?lobbyId=${myLobby.id}`, { method:'DELETE' })
    localStorage.removeItem('currentLobbyId')
    setMyLobby(null)
    await fetchList()
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Team Conquest</h1>
            <p className="text-gray-300">Monte sua equipe, convide amigos e conquiste a arena.</p>
          </div>
          <Button variant="ghost" onClick={()=>window.location.href='/battle'} className="text-gray-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2"/> Voltar
          </Button>
        </div>

        {/* Create Lobby */}
        {!myLobby && (
          <Card className="bg-white/5 border-white/10 mb-10">
            <CardHeader>
              <CardTitle className="text-white">Criar Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da equipe" className="bg-white/10 border-white/20 text-white" />
                <div className="flex items-center gap-2">
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                  <span className="text-sm text-gray-300">Privada?</span>
                </div>
                <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha (se privada)" className="bg-white/10 border-white/20 text-white" />
                <Input type="number" value={maxPlayers} onChange={e=>setMaxPlayers(parseInt(e.target.value||'6'))} className="bg-white/10 border-white/20 text-white" />
              </div>
              <Button onClick={createLobby} disabled={creating} className="bg-gradient-to-r from-blue-600 to-purple-600">{creating?"Criando...":"Criar Equipe"}</Button>
            </CardContent>
          </Card>
        )}

        {/* My Lobby */}
        {myLobby && (
          <Card className="bg-white/5 border-white/10 mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5"/> {myLobby.name} <Badge className={cn("ml-2", myLobby.isPrivate?"bg-rose-500":"bg-emerald-600")}>{myLobby.isPrivate?"Privada":"Aberta"}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary">Jogadores {myLobby.players.length}/{myLobby.maxPlayers}</Badge>
                <Badge variant="secondary">Convite: {myLobby.inviteCode.slice(0,8)}...</Badge>
                <Button size="sm" variant="outline" onClick={()=>navigator.clipboard.writeText(myLobby.inviteCode)} className="border-white/20 text-gray-200"><Copy className="w-4 h-4 mr-2"/>Copiar Código</Button>
                <Button size="sm" variant="outline" onClick={toggleOpen} className="border-white/20 text-gray-200">{myLobby.open?"Fechar Equipe":"Abrir Equipe"}</Button>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={leaveLobby} className="border-white/20 text-gray-200">Sair</Button>
                  {isLeader && <Button size="sm" variant="destructive" onClick={destroy}>Excluir</Button>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myLobby.players.map(p=> (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-sm">{p.name.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{p.name}</span>
                        {p.id === myLobby.leaderId && <Crown className="w-4 h-4 text-yellow-400"/>}
                      </div>
                      <span className="text-xs text-gray-400">{p.id}</span>
                    </div>
                    {isLeader && p.id !== myLobby.leaderId && (
                      <Button size="icon" variant="ghost" onClick={()=>kick(p.id)} className="text-gray-300"><UserMinus className="w-4 h-4"/></Button>
                    )}
                  </div>
                ))}
              </div>

              {isLeader && (
                <div className="mt-6 grid md:grid-cols-4 gap-3">
                  <Input defaultValue={myLobby.name} onBlur={e=>updateLobby({ name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  <Input type="number" defaultValue={myLobby.maxPlayers} onBlur={e=>updateLobby({ maxPlayers: parseInt(e.target.value||String(myLobby.maxPlayers)) })} className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="Nova senha (opcional)" onBlur={e=>updateLobby({ password: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  <div className="flex items-center gap-2"><Switch checked={myLobby.isPrivate} onCheckedChange={(v)=>updateLobby({ isPrivate: v })} /> <span className="text-sm text-gray-300">Privada?</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Discover Lobbies */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar equipes abertas" className="pl-9 bg-white/10 border-white/20 text-white"/>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={openOnly} onCheckedChange={setOpenOnly} />
            <span className="text-sm text-gray-300">Apenas abertas</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(lobby => (
            <Card key={lobby.id} className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5"/> {lobby.name}
                  {lobby.isPrivate ? <Lock className="w-4 h-4 text-rose-400"/> : <Unlock className="w-4 h-4 text-emerald-400"/>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Badge variant="secondary">{lobby.players.length}/{lobby.maxPlayers} jogadores</Badge>
                  <span>•</span>
                  <span className="truncate">Líder: {lobby.players.find(p=>p.id===lobby.leaderId)?.name || lobby.leaderId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={()=>joinLobby(lobby)} className="bg-gradient-to-r from-blue-600 to-purple-600">Entrar</Button>
                  {lobby.isPrivate && <Input placeholder="Senha" className="bg-white/10 border-white/20 text-white"/>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
