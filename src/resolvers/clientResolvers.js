import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";
import saveFile from "../helpers/saveFile.js";

export const clientCollection = db.collection('client');

export const ClientResolvers = {
    Client: {
        id: (parent) => parent.id ?? parent._id
    },
    Query: {
        clients: async (_, {pageNum, pageSize}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const data = await clientCollection.find().sort({companyName: -1}).skip((pageNum - 1) * pageSize).limit(pageSize);
            return {
                results: data.toArray(),
                total: await clientCollection.countDocuments()
            }
        },
        client: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await clientCollection.findOne({_id: new ObjectId(id)})
        },
        searchClient: async (_, {name}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await clientCollection.find({companyName: {$regex: name, $options: "i"}}).toArray();
        }
    },
    Mutation: {
        addClient: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const updatedData = {...data}
            if (data.logo) {
                updatedData['logo'] = await saveFile(data.logo, data.companyName + "_logo")
            }
            const company = await clientCollection.insertOne({...updatedData})
            return company.insertedId
        },
        updateClient: async (_, {data, id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const updatedData = {...data}
            if (data.logo) {
                updatedData['logo'] = await saveFile(data.logo, data.companyName + "_logo")
            }
            const company = await clientCollection.updateOne({_id: new ObjectId(id)}, {
                $set: updatedData
            })
            return company.acknowledged ? "success" : undefined
        }
    }
}