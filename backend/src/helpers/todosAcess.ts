import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
// import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
// import { TodoUpdate } from '../models/TodoUpdate';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

// const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

export class TodosAccess {
    
    constructor(
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly todoCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX) {
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()
        return todoItem
    }

    async deleteTodo(userId: string, todoId: string): Promise<string> {

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        }).promise()
        
        return JSON.stringify ({
            userId: userId,
            todoId: todoId
        })
    }

    async createAttachmentPresignedUrl(todoId: string) {
        return s3.getSignedUrl('putObject',{
            Bucket: this.bucketName,
            Key: todoId,
            Expires: parseInt(this.urlExpiration)
          })
    }

    async getTodos(userId): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todoCreatedAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest){
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            ExpressionAttributeNames: {"#N": "name"},
            UpdateExpression: 'set #N = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': updatedTodo.name,
                ':dueDate': updatedTodo.dueDate,
                ':done': updatedTodo.done
            }
        }).promise()

        return {
            userId: userId,
            todoId: todoId,
            ... updatedTodo
        }
    }
}