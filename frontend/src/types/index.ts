export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string; email: string }
  collaborators?: Array<{ id: string; user: { id: string; name: string; email: string } }>
  tasks?: Task[]
  _count?: { tasks: number; collaborators: number }
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  dueDate?: string | null
  projectId: string
  assigneeId?: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  assignee?: { id: string; name: string; email: string } | null
  createdBy?: { id: string; name: string; email: string }
  labels?: Array<{ label: Label }>
  project?: { id: string; name: string }
}

export interface Label {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}
