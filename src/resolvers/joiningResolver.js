import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {openingsCollection} from "./openingsResolvers.js";
import {GraphQLError} from "graphql/error/index.js";
import {candidateCollection} from "./candidateResolvers.js";
import {clientCollection} from "./clientResolvers.js";
import {vendorCollection} from "./vendorResolvers.js";
import {companyCollection} from "./companyResolvers.js";

const collection = db.collection('joinings');

export const joiningCollection = collection

export const JoiningResolvers = {
    Joining: {
        id: (parent) => parent.id ?? parent._id,
        candidate: async (parent) => candidateCollection.findOne({_id: parent.candidate}),
        client: async (parent) => clientCollection.findOne({_id: parent.client}),
        vendor: async (parent) => vendorCollection.findOne({_id: parent.vendor}),
        company: async (parent) => companyCollection.findOne({_id: parent.company}),
    },
    Query: {
        joining: async (_, {id}, context) => {
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
        joiningByCandidate: async (_, {candidateId, openingId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }

            const joiningArray = await collection.find({candidate: new ObjectId(candidateId)}).toArray()
            let joinings = []
            for (const joining of joiningArray) {
                joinings.push({
                    joining,
                    opening: await openingsCollection.findOne({joinings: joining._id})
                })
            }

            return {
                candidate: await candidateCollection.findOne({_id: new ObjectId(candidateId)}),
                joinings,

            }
        },
        joiningByBank: async (_, {companyId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const joinings = await joiningCollection.find({company: new ObjectId(companyId)}).sort({vendor: 1}).toArray()
            const resp = []
            for (const joining of joinings) {
                resp.push({
                    candidate: await candidateCollection.findOne({_id: joining.candidate}),
                    vendor: await vendorCollection.findOne({_id: joining.vendor}),
                })
            }
            return resp
        }
    },
    Mutation: {
        addJoining: async (_, {data, openingId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const joining = await collection.insertOne({
                ...data,
                candidate: new ObjectId(data.candidate),
                company: new ObjectId(data.company),
                vendor: new ObjectId(data.vendor),
                client: new ObjectId(data.client),
            })
            await openingsCollection.updateOne({_id: new ObjectId(openingId)}, {
                $push: {
                    joinings: joining.insertedId
                }
            })
            return joining.insertedId
        },
        updateJoining: async (_, {data, joiningId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const joining = await collection.updateOne({_id: new ObjectId(joiningId)}, {
                $set: {
                    ...data,
                    candidate: new ObjectId(data.candidate),
                    company: new ObjectId(data.company),
                }
            })
            return joining.acknowledged ? "success" : undefined
        }
    }
}