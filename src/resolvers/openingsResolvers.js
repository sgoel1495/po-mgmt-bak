import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {vendorCollection} from "./vendorResolvers.js";
import {GraphQLError} from "graphql/error/index.js";
import {joiningCollection} from "./joiningResolver.js";

const collection = db.collection('openings');

export const openingsCollection = collection

export const OpeningResolvers = {
    Opening: {
        id: (parent) => parent.id ?? parent._id,
        joinings: async (parent) => await joiningCollection.find({_id: {$in: parent.joinings}}).toArray(),
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
        },
        updateOpening: async (_, {data, openingId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const opening = await collection.updateOne({_id: new ObjectId(openingId)}, {
                $set: {
                    ...data,
                    candidates: []
                }
            });
            return opening.acknowledged ? "success" : undefined
        }
    }
}