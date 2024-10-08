import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('candidate');

export const candidateCollection = collection

export const CandidateResolvers = {
    Candidate: {
        id: (parent) => parent.id ?? parent._id
    },
    Query: {
        candidates: async (_, {pageNum, pageSize}, context) => {
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
        candidate: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await collection.findOne({_id: new ObjectId(id)})
        },
        searchCandidate: async (_, {name}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await collection.find({name: {$regex: name, $options: "i"}}).toArray();

        }
    },
    Mutation: {
        addCandidate: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const candidate = await collection.insertOne({...data})
            return candidate.insertedId
        },
        updateCandidate: async (_, {data, id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const candidate = await collection.updateOne({_id: new ObjectId(id)}, {$set: {...data}})
            return candidate.acknowledged ? "success" : undefined
        }
    }
}