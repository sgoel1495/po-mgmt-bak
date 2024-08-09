import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {vendorCollection} from "./vendorResolvers.js";
import {candidateCollection} from "./candidateResolvers.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('openings');

export const openingsCollection = collection

export const OpeningResolvers = {
    Opening: {
        id: (parent) => parent.id ?? parent._id,
        candidates: async (parent) => await candidateCollection.find({_id: {$in: parent.candidates}}).toArray(),
    },
    Query: {
        opening: async (_, {id}, context) => {
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
        addOpening: async (_, {data, vendorId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const opening = await collection.insertOne({...data, candidates: []});
            await vendorCollection.updateOne({_id: new ObjectId(vendorId)}, {
                $push: {
                    openings: opening.insertedId
                }
            })
            return opening.insertedId
        }
    }
}