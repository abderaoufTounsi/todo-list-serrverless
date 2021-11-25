import { TodosAccess } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic

const bucketName = process.env.ATTACHMENT_S3_BUCKET

const todosAcess = new TodosAccess()

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
  
    return await todosAcess.createTodo({
        userId: userId,
        todoId: todoId,
        createdAt: createdAt,
        done: false,
        ...createTodoRequest,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    })
}

export async function deleteTodo(todoId: string, userId: string): Promise<string> {
  
    return await todosAcess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(todoId: string) {

    return await todosAcess.createAttachmentPresignedUrl(todoId)
}

export async function getTodos(userId: string) {
    
    return await todosAcess.getTodos(userId)
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) {
    
    return await todosAcess.updateTodo(userId, todoId, updatedTodo)
}