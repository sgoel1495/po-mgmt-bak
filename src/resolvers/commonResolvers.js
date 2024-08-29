import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";
import saveFile from "../helpers/saveFile.js";
import deleteFile from "../helpers/deleteFile.js";
import {config} from "../config/index.js";
import fs from 'fs'

export const documentCollection = db.collection('documents');

export const CommonResolvers = {
    Upload: GraphQLUpload,
    Documents: {
        id: (parent) => parent.id ?? parent._id
    },
    Query: {
        documents: async (_, {pageNum, pageSize, ownerId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const data = await documentCollection.find({ownerId: new ObjectId(ownerId)}).sort({companyName: -1}).skip((pageNum - 1) * pageSize).limit(pageSize);
            return {
                results: data.toArray(),
                total: await documentCollection.countDocuments({ownerId: new ObjectId(ownerId)})
            }
        },
        getTimeSheetFormats: (_, __, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const options = []
            fs.readdirSync(config.timesheetFormatsDirectoryUrl).forEach(file => {
                options.push({
                    value: file,
                    label: file.replace('.ejs', ''),
                })
            });
            return options
        },
        getInvoiceFormats: (_, __, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const options = []
            fs.readdirSync(config.invoiceFormatsDirectoryUrl).forEach(file => {
                options.push({
                    value: file,
                    label: file.replace('.ejs', ''),
                })
            });
            return options
        }
    },
    Mutation: {
        addDocument: async (_, {data, ownerId}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            let link
            if (data.file) {
                link = await saveFile(data.file, data.name + "_" + ownerId)
            }
            const company = await documentCollection.insertOne({
                name: data.name,
                description: data.description,
                link: link,
                ownerId: new ObjectId(ownerId)
            })
            return company.insertedId
        },
        updateDocument: async (_, {data, id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            let link
            if (data.file) {
                const ownerId = (await documentCollection.findOne({_id: new ObjectId(id)})).ownerId.toString()
                link = await saveFile(data.file, data.name + "_" + ownerId)
            }
            const document = await documentCollection.updateOne({_id: new ObjectId(id)}, {
                $set: {
                    name: data.name,
                    description: data.description,
                    link: link
                }
            })
            return document.acknowledged ? "success" : undefined
        },
        deleteDocument: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const link = (await documentCollection.findOne({_id: new ObjectId(id)})).link
            deleteFile(link)
            const document = await documentCollection.deleteOne({_id: new ObjectId(id)})
            return document.acknowledged ? "success" : undefined
        },
    }
}