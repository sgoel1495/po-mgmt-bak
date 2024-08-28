import fs from "fs";
import Ejs from 'ejs'
import axios from "axios";
import {config} from "../config/index.js";
import {saveData} from "./saveData.js";

function _generateHtml(data, templatePath) {
    const template = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = Ejs.compile(template);
    return !data ? compiledTemplate() : compiledTemplate(data);
}

export const generatePDF = async (data, templateName, name) => {
    const templatePath = new URL(templateName, config.timesheetFormatsDirectoryUrl);
    const templateFooterPath = new URL(templateName, config.timesheetFooterFormatsDirectoryUrl);
    const html = _generateHtml(data, templatePath);
    await saveData(html, name+".html")
    const footer = fs.readFileSync(templateFooterPath, 'utf8')
    const resp = await axios.post("https://bench-sales-2giio5eruq-ue.a.run.app/api/v1/doc", {
        html,
        footer
    }, {
        contentType: 'text/html',
        responseType: 'arraybuffer',
    })
    await saveData(resp.data, name)
}
