import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {clientCollection} from "./clientResolvers.js";
import {openingsCollection} from "./openingsResolvers.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('vendor');
export const vendorCollection = collection
export const VendorResolvers = {
    Vendor: {
        id: (parent) => parent.id ?? parent._id,
        client: async (parent) => await clientCollection.findOne({_id: parent.client}),
        openings: async (parent) => await openingsCollection.find({_id: {$in: parent.openings}}).toArray()
    },
    Query: {
        vendors: async (_, {pageNum, pageSize}, context) => {
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
        vendor: async (_, {id}, context) => {
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
        addVendor: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const vendor = await collection.insertOne({...data, client: new ObjectId(data.client), openings: []})
            return vendor.insertedId
        },
        updateVendor: async (_, {data, id}, context) => {
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
                    ...data,
                    client: new ObjectId(data.client)
                }
            })
            return vendor.acknowledged ? "success" : undefined
        }
    }
}