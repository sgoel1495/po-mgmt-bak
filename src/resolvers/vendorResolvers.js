import {ObjectId} from "mongodb";
import db from "../config/mongoConnection.js";
import {companyCollection} from "./companyResolvers.js";
import {openingsCollection} from "./openingsResolvers.js";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('vendor');
export const vendorCollection = collection
export const VendorResolvers = {
    Vendor: {
        id: (parent) => parent.id ?? parent._id,
        company: async (parent) => await companyCollection.findOne({_id: parent.company}),
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
            const data = await collection.find().sort({name: -1}).limit((pageNum - 1) * pageSize).limit(pageSize);
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
            const vendor = await collection.insertOne({...data, company: new ObjectId(data.company), openings: []})
            return vendor.insertedId
        }
    }
}