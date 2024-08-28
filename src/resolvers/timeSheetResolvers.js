import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";
import {generatePDF} from "../helpers/createPDF.js";
import {joiningCollection} from "./joiningResolver.js";
import {clientCollection} from "./clientResolvers.js";
import dayjs from 'dayjs'
import {candidateCollection} from "./candidateResolvers.js";
import {openingsCollection} from "./openingsResolvers.js";
import {_generateMonthArray, _getOTHours, _getStandardHours, _getTotalHours} from "../helpers/timesheet.js";
import {config} from "../config/index.js";
import fs from "fs";

const collection = db.collection('timesheets');

export const TimeSheetResolvers = {
    TimeSheet: {
        id: (parent) => parent.id ?? parent._id,
    },
    Query: {
        getTimeSheet: async (_, {month, joining}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            return await collection.findOne({month, joining})
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
        },
        downloadTimesheet: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const url = new URL(`timesheet_${id}.pdf`, config.uploadDirectoryUrl)
            return fs.readFileSync(url)
        },
        generateTimesheet: async (_, {id}, context) => {
            if (!context.isValid) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: {status: 401},
                    },
                });
            }
            const timeSheet = await collection.findOne({_id: new ObjectId(id)})
            const joining = await joiningCollection.findOne({_id: new ObjectId(timeSheet.joining)})
            const opening = (await openingsCollection.find({joinings: joining._id}).toArray())[0]
            const candidate = await candidateCollection.findOne({_id: new ObjectId(joining.candidate)})
            const client = await clientCollection.findOne({_id: new ObjectId(joining.client)})
            const url = new URL(client.logo, config.mediaHost)
            await generatePDF({
                logo: url+"?token=1q2w3e4r5t",
                companyName: client.companyName.toUpperCase(),
                month: dayjs(timeSheet.month).get('month'),
                monthLabel: dayjs(timeSheet.month).format('MMMM\'YY').toUpperCase(),
                cid: joining.empId,
                employeeName: candidate.name,
                reportingManager: joining.timesheetApprover.name,
                reportingEmail: joining.timesheetApprover.email,
                endClientName: opening.endClient,
                endClientLocation: opening.location,
                creationDate: timeSheet.submissionDate.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }),
                status: timeSheet.status,
                approvalDate: timeSheet.approvalDate.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }),
                timecardGridObject: _generateMonthArray(timeSheet.month, timeSheet.timeSheet),
                totalRegHrs: _getStandardHours(timeSheet.timeSheet),
                totalHrs: _getTotalHours(timeSheet.timeSheet),
                totalExtraHrs: _getOTHours(timeSheet.timeSheet)
            }, client.timeSheetFormat, "timesheet_" + id + ".pdf")
            return "success"
        }
    }
}