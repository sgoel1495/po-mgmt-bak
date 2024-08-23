import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('vault');
export const vaultCollection = collection
export const VaultResolvers = {
    Vendor: {
        id: (parent) => parent.id ?? parent._id,
    },
    Query: {
        secrets: async (_, {pageNum, pageSize}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const data = await collection.find().sort({name: -1}).skip((pageNum - 1) * pageSize).limit(pageSize);
            return {
                results: data.toArray(),
                total: await collection.countDocuments()
            }
        },
        secret: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await collection.findOne({_id: new ObjectId(id)})
        }
    },
    Mutation: {
        addSecret: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const vendor = await collection.insertOne({...data})
            return vendor.insertedId
        },
        updateSecret: async (_, {data, id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const vendor = await collection.updateOne({_id: new ObjectId(id)}, {
                $set: {
                    ...data
                }
            })
            return vendor.acknowledged ? "success" : undefined
        }
    },
    deleteSecret: async (_, {id}, context) => {
        if (!context.isValid) {
            throw new GraphQLError('User is not authenticated', {
                extensions: {
                    code: 'UNAUTHENTICATED',
                    http: {status: 401},
                },
            });
        }
        await collection.deleteOne({_id: new ObjectId(id)})
        return "Success"
    },
}