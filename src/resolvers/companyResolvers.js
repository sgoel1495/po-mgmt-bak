import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";

export const companyCollection = db.collection('company');

export const CompanyResolvers = {
    Company: {
        id: (parent) => parent.id ?? parent._id
    },
    Query: {
        companies: async (_, {pageNum, pageSize}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const data = await companyCollection.find().sort({companyName: -1}).skip((pageNum - 1) * pageSize).limit(pageSize);
            return {
                results: data.toArray(),
                total: await companyCollection.countDocuments()
            }
        },
        company: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await companyCollection.findOne({_id: new ObjectId(id)})
        },
        searchCompany: async (_, {name}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await companyCollection.find({companyName: {$regex: name, $options: "i"}}).toArray();
        }
    },
    Mutation: {
        addCompany: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const company = await companyCollection.insertOne({...data})
            return company.insertedId
        },
        updateCompany: async (_, {data, id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const company = await companyCollection.updateOne({_id: new ObjectId(id)}, {
                $set: {...data}
            })
            return company.acknowledged ? "success" : undefined
        }
    }
}