import { supabase, isSupabaseConfigured } from './supabase'
import type { ResearchProject, Citation } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

  // Sync projects to Supabase
  async syncProjects(projects: ResearchProject[]) {
    if (!this.userId || !isSupabaseConfigured()) return

    for (const project of projects) {
      const { data: existing } = await supabase
        .from('projects')
        .select('updated_at')
        .eq('id', project.id)
        .single()

      const projectData: any = {
        id: project.id,
        user_id: this.userId,
        name: project.name,
        thesis: project.thesis,
      }

      if (existing) {
        await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
      } else {
        await supabase
          .from('projects')
          .insert(projectData)
      }

      // Sync citations for this project
      await this.syncCitations(project.id, project.citations)
    }
  }

  // Sync citations to Supabase
  async syncCitations(projectId: string, citations: Citation[]) {
    if (!this.userId || !isSupabaseConfigured()) return

    for (const citation of citations) {
      const citationData: any = {
        id: citation.id,
        project_id: projectId,
        author: citation.author,
        title: citation.title,
        year: citation.publicationDate || '',
        journal: citation.containerTitle || '',
        volume: citation.volume || '',
        issue: citation.issue || '',
        pages: citation.pages || '',
        publisher: citation.publisher || '',
        url: citation.url || '',
        doi: '',
        notes: citation.notes || '',
        categories: citation.categoryIds || [],
      }

      const { data: existing } = await supabase
        .from('citations')
        .select('id')
        .eq('id', citation.id)
        .single()

      if (existing) {
        await supabase
          .from('citations')
          .update(citationData)
          .eq('id', citation.id)
      } else {
        await supabase
          .from('citations')
          .insert(citationData)
      }
    }
  }

  // Load projects from Supabase
  async loadProjects(): Promise<ResearchProject[]> {
    if (!this.userId || !isSupabaseConfigured()) return []

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        citations (*)
      `)
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading projects:', error)
      return []
    }

    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      thesis: project.thesis,
      categories: [],
      connections: [],
      outline: [],
      createdAt: new Date(project.created_at).getTime(),
      updatedAt: new Date(project.updated_at).getTime(),
      citations: (project.citations || []).map((c: any) => ({
        id: c.id,
        author: c.author,
        title: c.title,
        publicationDate: c.year,
        containerTitle: c.journal,
        volume: c.volume,
        issue: c.issue,
        pages: c.pages,
        publisher: c.publisher,
        url: c.url,
        notes: c.notes,
        categoryIds: c.categories || [],
        sourceType: 'other' as const,
        createdAt: new Date(c.created_at).getTime(),
      })),
    }))
  }

  // Subscribe to real-time changes
  subscribeToChanges(
    onProjectChange: (payload: any) => void,
    onCitationChange: (payload: any) => void
  ) {
    if (!this.userId || !isSupabaseConfigured()) return

    // Subscribe to project changes
    const projectChannel = supabase
      .channel('projects-changes')
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

    // Subscribe to citation changes
    const citationChannel = supabase
      .channel('citations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citations',
        },
        onCitationChange
      )
      .subscribe()

    this.channels.push(projectChannel, citationChannel)
  }

  // Unsubscribe from all channels
  unsubscribe() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.channels = []
  }

  // Delete a project
  async deleteProject(projectId: string) {
    if (!isSupabaseConfigured()) return

    await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
  }

  // Delete a citation
  async deleteCitation(citationId: string) {
    if (!isSupabaseConfigured()) return

    await supabase
      .from('citations')
      .delete()
      .eq('id', citationId)
  }
}

export const supabaseSync = new SupabaseSync()
