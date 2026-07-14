import { supabase, isSupabaseConfigured } from './supabase'
import type { ResearchProject } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createDefaultOutline } from './outline'

function projectToRow(userId: string, project: ResearchProject) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    thesis: project.thesis,
    data: {
      name: project.name,
      thesis: project.thesis,
      citations: project.citations,
      categories: project.categories,
      connections: project.connections,
      outline: project.outline,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    updated_at: new Date(project.updatedAt || Date.now()).toISOString(),
  }
}

function rowToProject(row: any): ResearchProject {
  const data = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    id: row.id,
    name: data.name ?? row.name ?? 'Untitled Research',
    thesis: data.thesis ?? row.thesis ?? '',
    citations: Array.isArray(data.citations) ? data.citations : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    connections: Array.isArray(data.connections) ? data.connections : [],
    outline: Array.isArray(data.outline) && data.outline.length > 0
      ? data.outline
      : createDefaultOutline(),
    createdAt: data.createdAt ?? (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updatedAt: data.updatedAt ?? (row.updated_at ? new Date(row.updated_at).getTime() : Date.now()),
  }
}

export class SupabaseSync {
  private channels: RealtimeChannel[] = []
  private userId: string | null = null

  async initialize(userId: string) {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using local storage only')
      return false
    }
    this.userId = userId
    return true
  }

  /** Upsert full project state (mind map, categories, sources, outline). */
  async syncProjects(projects: ResearchProject[]) {
    if (!this.userId || !isSupabaseConfigured()) return { error: null as any }

    const rows = projects.map((p) => projectToRow(this.userId!, p))

    const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id' })

    if (error) {
      console.error('Sync projects error:', error)
      return { error }
    }

    return { error: null }
  }

  async loadProjects(): Promise<ResearchProject[]> {
    if (!this.userId || !isSupabaseConfigured()) return []

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading projects:', error)
      return []
    }

    return (projects || []).map(rowToProject)
  }

  subscribeToChanges(onProjectChange: (payload: any) => void) {
    if (!this.userId || !isSupabaseConfigured()) return

    const projectChannel = supabase
      .channel(`projects-changes-${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${this.userId}`,
        },
        onProjectChange
      )
      .subscribe()

    this.channels.push(projectChannel)
  }

  unsubscribe() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels = []
  }

  async deleteProject(projectId: string) {
    if (!isSupabaseConfigured()) return

    await supabase.from('projects').delete().eq('id', projectId)
  }
}

export const supabaseSync = new SupabaseSync()
