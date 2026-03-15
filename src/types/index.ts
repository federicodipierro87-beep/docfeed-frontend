// Tipi condivisi per DocuVault Frontend

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'READONLY'

export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DELETED'

export type LicensePlan = 'BASE' | 'TEAM' | 'BUSINESS' | 'ENTERPRISE'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  isActive: boolean
  organizationId: string
  organization?: Organization
  lastLoginAt?: string
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
}

export interface License {
  plan: LicensePlan
  maxUsers: number
  maxStorageGB: number
  features: string[]
  validUntil: string
  isValid: boolean
  currentUsers: number
  currentStorageGB: number
}

export interface Vault {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  metadataClass?: MetadataClass
  _count?: { documents: number }
}

export interface Document {
  id: string
  name: string
  description?: string
  mimeType: string
  status: DocumentStatus
  vault: Vault
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>
  currentVersion?: DocumentVersion
  workflowState?: WorkflowState
  tags?: Array<{ tag: Tag }>
  metadata?: DocumentMetadata[]
  checkedOutBy?: Pick<User, 'id' | 'firstName' | 'lastName'>
  checkedOutAt?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  versionNumber: number
  fileSizeBytes: number
  checksum: string
  comment?: string
  ocrText?: string
  ocrProcessed: boolean
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>
  createdAt: string
}

export interface MetadataClass {
  id: string
  name: string
  description?: string
  fields: MetadataField[]
}

export interface MetadataField {
  id: string
  name: string
  label: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'USER' | 'DOCUMENT_REF'
  isRequired: boolean
  isSearchable: boolean
  defaultValue?: string
  options?: string[]
  order: number
}

export interface DocumentMetadata {
  id: string
  field: MetadataField
  textValue?: string
  numberValue?: number
  dateValue?: string
  booleanValue?: boolean
  jsonValue?: unknown
  userRef?: Pick<User, 'id' | 'firstName' | 'lastName'>
}

export interface Tag {
  id: string
  name: string
  color: string
  _count?: { documents: number }
}

export interface Workflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  states: WorkflowState[]
  transitions?: WorkflowTransition[]
  _count?: { documents: number }
}

export interface WorkflowState {
  id: string
  name: string
  description?: string
  color: string
  isInitial: boolean
  isFinal: boolean
  order: number
}

export interface WorkflowTransition {
  id: string
  name: string
  fromState: Pick<WorkflowState, 'id' | 'name'>
  toState: Pick<WorkflowState, 'id' | 'name' | 'color'>
}

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  document?: Pick<Document, 'id' | 'name'>
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}

export interface RetentionPolicy {
  id: string
  name: string
  description?: string
  retentionDays: number
  action: 'ARCHIVE' | 'DELETE' | 'NOTIFY'
  isActive: boolean
  _count?: { documents: number }
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface TokenResponse {
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

// Search types
export interface SearchParams {
  q?: string
  vaultId?: string
  mimeTypes?: string[]
  tags?: string[]
  workflowStateId?: string
  createdAfter?: string
  createdBefore?: string
  cursor?: string
  limit?: number
}

// Filter types
export interface DocumentFilters {
  vaultId?: string
  status?: DocumentStatus
  mimeType?: string
  tags?: string[]
  workflowStateId?: string
  createdById?: string
  createdAfter?: string
  createdBefore?: string
  search?: string
}
