export type UserObject = {
    name:string
    email:string
    password:string
    role:string
    status:string
    image:string
    publicid:string
    phone: number | null
    country: string
    dob: string
    createdAt: string 
    review: string
}



export interface AuthenticatedRequest extends Request {
    user?: any
}