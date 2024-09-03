import db from "../config/mongoConnection.js";
import {ObjectId} from "mongodb";
import {GraphQLError} from "graphql/error/index.js";
import {generateInvoicePDF, generateTimesheetPDF} from "../helpers/createPDF.js";
import {joiningCollection} from "./joiningResolver.js";
import {clientCollection} from "./clientResolvers.js";
import dayjs from 'dayjs'
import {candidateCollection} from "./candidateResolvers.js";
import {openingsCollection} from "./openingsResolvers.js";
import {_generateMonthArray, _getOTHours, _getStandardHours, _getTotalHours} from "../helpers/timesheet.js";
import {config} from "../config/index.js";
import {vendorCollection} from "./vendorResolvers.js";
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(timezone)
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
            const data = {
                logo: url + "?token=1q2w3e4r5t",
                companyName: client.companyName.toUpperCase(),
                month: dayjs(timeSheet.month).get('month'),
                monthLabel: dayjs(timeSheet.month).format('MMMM\'YY').toUpperCase(),
                cid: joining.empId,
                employeeName: candidate.name,
                reportingManager: joining.timesheetApprover.name,
                reportingEmail: joining.timesheetApprover.email,
                endClientName: opening.endClient,
                endClientLocation: opening.location,
                creationDate: dayjs(timeSheet.submissionDate).utc().format('MM/DD/YYYY'),
                status: timeSheet.status,
                approvalDate: dayjs(timeSheet.approvalDate).utc().format('MM/DD/YYYY'),
                timecardGridObject: _generateMonthArray(timeSheet.month, timeSheet.timeSheet),
                totalRegHrs: _getStandardHours(timeSheet.timeSheet),
                totalHrs: _getTotalHours(timeSheet.timeSheet),
                totalExtraHrs: _getOTHours(timeSheet.timeSheet)
            }
            await generateTimesheetPDF(data, client.timeSheetFormat, "timesheet_" + id + ".pdf")
            return "success"
        },
        generateInvoice: async (_, {id}, context) => {
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
            const candidate = await candidateCollection.findOne({_id: new ObjectId(joining.candidate)})
            const vendor = await vendorCollection.findOne({_id: new ObjectId(joining.vendor)})
            const existingInvoice = joining.invoices ? joining.invoices.findIndex((item) => item.month === timeSheet.month) : -1
            let invoiceNumber = existingInvoice >= 0 ? existingInvoice + 1 : joining.invoices ? joining.invoices.length + 1 : 1
            const regHours = _getStandardHours(timeSheet.timeSheet)
            const otHours = _getOTHours(timeSheet.timeSheet)
            let dueDate = dayjs().tz("America/Toronto").add(joining.paymentTerms, 'day')
            if(joining.fixedMonthDate){
                dueDate = dayjs().set("month",dayjs(timeSheet.month).get("month")+1).set("date",joining.paymentTerms)
            }
            let contact = candidate.contact.replace("+1","")
            contact = contact.slice(0,3)+"-"+contact.slice(3,6)+"-"+contact.slice(6)
            const data = {
                invoiceNo: invoiceNumber,
                cdLabel: dayjs().tz("America/Toronto").format('MM/DD/YYYY'),
                toCompanyName: vendor.name,
                toAdrs1: vendor.addressLine1,
                toAdrs2: vendor.addressLine2,
                toAdrs3: vendor.addressLine3,
                monthLabel: dayjs(timeSheet.month).format('MMMM YYYY'),
                ddLabel: dueDate.format('MM/DD/YYYY dddd').toUpperCase(),
                ddLabel2: dueDate.format('MM/DD/YYYY').toUpperCase(),
                totalRegHrs: regHours,
                rate: (joining.candidateRate.rate).toFixed(2),
                regularHrAmt: (joining.candidateRate.rate * regHours).toFixed(2),
                totalExtraHrs: otHours,
                extraRate: joining.candidateRate.otRate.toFixed(2),
                overtimeHrAmt: (joining.candidateRate.otRate * otHours).toFixed(2),
                totalAmt: ((joining.candidateRate.otRate * otHours) + (joining.candidateRate.rate * regHours)).toFixed(2),
                fromName: candidate.name,
                fromPhone: contact,
            }
            const filename = `invoice ${invoiceNumber.toString().padStart(4, '0')}_${joining._id}.pdf`
            await generateInvoicePDF(data, joining.invoiceFormat, filename, 'invoice')
            if (existingInvoice === -1)
                await joiningCollection.updateOne({_id: joining._id}, {
                    $push: {
                        invoices: {
                            name: filename,
                            month: timeSheet.month
                        }
                    }
                })
            return "success"
        }
    }
}