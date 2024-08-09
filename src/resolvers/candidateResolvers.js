import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {openingsCollection} from "./openingsResolvers.js";
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
            const data = await collection.find().sort({name: -1}).limit((pageNum - 1) * pageSize).limit(pageSize);
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
        }
    },
    Mutation: {
        addCandidate: async (_, {data, openingId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const candidate = await collection.insertOne({...data})
            await openingsCollection.updateOne({_id: new ObjectId(openingId)}, {
                $push: {
                    candidates: candidate.insertedId
                }
            })
            return candidate.insertedId
        }
    }
}