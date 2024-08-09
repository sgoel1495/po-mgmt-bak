import db from "../config/mongoConnection.js";
import {AuthService, TokenCollection} from "../helpers/authService.js";
import {HashPassword, IsValidPassword} from "../helpers/password.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('users');
AuthService.init()
export const UsersResolvers = {
    Query: {
        login: async (_, {username, password}) => {
            const user = await collection.findOne({username});
            if (!user)
                throw new GraphQLError('Invalid Credentials', {
                    extensions: {
                        code: 'INVALID_CREDENTIALS',
                        http: {status: 400}
                    },
                });
            if (IsValidPassword(password, user.password, user.salt)) {
                return {tokens: await AuthService.CreateUserToken(username), role: user.role};
            } else {
                throw new GraphQLError('Invalid Credentials', {
                    extensions: {
                        code: 'INVALID_CREDENTIALS',
                        http: {status: 400}
                    },
                });
            }

        },
        users: async (_, {pageNum, pageSize}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const data = await collection.find().sort({name: -1}).limit((pageNum - 1) * pageSize).limit(pageSize);
            return {
                results: data.toArray(),
                total: await collection.countDocuments()
            }
        }
    },
    Mutation: {
        deleteUser: async (_, {username}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            await collection.deleteOne({username})
            await TokenCollection.deleteMany({userId: username})
            return "Success"
        },
        updateUser: async (_, {username, password, role}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            let updatedFields = {}
            if (password) {
                updatedFields = HashPassword(password)
            }
            updatedFields['role'] = role
            await collection.updateOne({username}, {
                $set: updatedFields
            })
            return "Success"
        },
        addUser: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const userExists = await collection.findOne({username: data.username});
            if (userExists) {
                throw new GraphQLError('Username already exists', {
                    extensions: {
                        code: 'CONFLICT',
                        http: {status: 409},
                    },
                });
            }
            const user = await collection.insertOne({
                username: data.username, ...HashPassword(data.password),
                createdAt: new Date(), role: data.role
            });
            return user.insertedId
        }
    }
}