import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";

const collection = db.collection('timesheets');

export const TimeSheetResolvers = {
    TimeSheet: {
        id: (parent) => parent.id ?? parent._id,
    },
    Query: {
        getTimeSheet: async (_, {month, candidate}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await collection.findOne({month, candidate})
        }
    },
    Mutation: {
        updateTimeSheet: async (_, {data}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            if (data.id) {
                const doc = await collection.updateOne({_id: new ObjectId(data.id)}, {
                    $set: {...data}
                });
                return doc.acknowledged.toString()
            } else {
                const doc = await collection.insertOne({...data});
                return doc.insertedId
            }
        }
    }
}