import express from 'express';
import cors from 'cors';

//highlight-start
import gql from "graphql-tag";
import {ApolloServer} from '@apollo/server';
import {buildSubgraphSchema} from '@apollo/subgraph';
import {expressMiddleware} from '@apollo/server/express4';
import {readFileSync} from "fs";
import {ClientResolvers} from "./resolvers/clientResolvers.js";
import {VendorResolvers} from "./resolvers/vendorResolvers.js";
import {CandidateResolvers} from "./resolvers/candidateResolvers.js";
import {TimeSheetResolvers} from "./resolvers/timeSheetResolvers.js";
import {typeDefs as scalarTypeDefs} from 'graphql-scalars';
import {resolvers as scalarResolvers} from 'graphql-scalars';
import {CommonResolvers} from "./resolvers/commonResolvers.js";
import {OpeningResolvers} from "./resolvers/openingsResolvers.js";
import {UsersResolvers} from "./resolvers/usersResolvers.js";
import {AuthService} from "./helpers/authService.js";
import {GraphQLError} from "graphql/error/index.js";
import {startStandaloneServer} from "@apollo/server/standalone";
import {CompanyResolvers} from "./resolvers/companyResolvers.js";
import {JoiningResolvers} from "./resolvers/joiningResolver.js";
import {VaultResolvers} from "./resolvers/vaultResolvers.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import {config} from "./config/index.js";
//highlight-end

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

//highlight-start
const clientTypeDefs = gql(
    readFileSync("./src/schemas/client.graphql", {
        encoding: "utf-8",
    })
);

const vendorTypeDefs = gql(
    readFileSync("./src/schemas/vendor.graphql", {
        encoding: "utf-8",
    })
);

const candidateTypeDefs = gql(
    readFileSync("./src/schemas/candidate.graphql", {
        encoding: "utf-8",
    })
);

const timeSheetTypeDefs = gql(
    readFileSync("./src/schemas/timeSheet.graphql", {
        encoding: "utf-8",
    })
);

const commonTypeDefs = gql(
    readFileSync("./src/schemas/common.graphql", {
        encoding: "utf-8",
    })
);

const openingTypeDefs = gql(
    readFileSync("./src/schemas/openings.graphql", {
        encoding: "utf-8",
    })
);

const userTypeDefs = gql(
    readFileSync("./src/schemas/users.graphql", {
        encoding: "utf-8",
    })
);
const companyTypeDefs = gql(
    readFileSync("./src/schemas/company.graphql", {
        encoding: "utf-8",
    })
);

const joiningTypeDefs = gql(
    readFileSync("./src/schemas/joining.graphql", {
        encoding: "utf-8",
    })
);

const vaultTypeDefs = gql(
    readFileSync("./src/schemas/vault.graphql", {
        encoding: "utf-8",
    })
);

const server = new ApolloServer({
    schema: buildSubgraphSchema([
        {typeDefs: gql(scalarTypeDefs.join('\n')), resolvers: scalarResolvers},
        {typeDefs: clientTypeDefs, resolvers: ClientResolvers},
        {typeDefs: vendorTypeDefs, resolvers: VendorResolvers},
        {typeDefs: candidateTypeDefs, resolvers: CandidateResolvers},
        {typeDefs: timeSheetTypeDefs, resolvers: TimeSheetResolvers},
        {typeDefs: commonTypeDefs, resolvers: CommonResolvers},
        {typeDefs: openingTypeDefs, resolvers: OpeningResolvers},
        {typeDefs: userTypeDefs, resolvers: UsersResolvers},
        {typeDefs: companyTypeDefs, resolvers: CompanyResolvers},
        {typeDefs: joiningTypeDefs, resolvers: JoiningResolvers},
        {typeDefs: vaultTypeDefs, resolvers: VaultResolvers},
    ]),
});
// Note you must call `start()` on the `ApolloServer`
// instance before passing the instance to `expressMiddleware`
await server.start();


//highlight-end

// const {url} = await startStandaloneServer(server, {
//     listen: {port: PORT, path: '/graphql'},
//     context: async ({req}) => {
//         // // get the user token from the headers
//         const token = req.headers.authorization || '';
//         //
//         // // try to retrieve a user with the token
//         let isValid = false
//         try {
//             AuthService.init()
//             isValid = await AuthService.ValidateAccessToken(token.replace("Bearer ", ''));
//         } catch (e) {
//         }
//
//         // // add the user to the context
//         return {isValid};
//     },
// });

const authenticate = async (req) => {
    const token = req.headers.authorization || '';

    // try to retrieve a user with the token
    let isValid = false
    try {
        AuthService.init()
        isValid = await AuthService.ValidateAccessToken(token.replace("Bearer ", ''));
    } catch (e) {
    }

    // add the user to the context
    return isValid;
}

app.use('/media', async (req, res, next) => {
    if (await authenticate(req))
        return next();
    return res.status(401).send('Not authorized');
}, express.static(config.uploadDirectoryUrl.pathname))

app.use(
    '/graphql',
    cors(),
    graphqlUploadExpress(),
    express.json(),
    expressMiddleware(server, {
        context: async ({req}) => {
            return {isValid: await authenticate(req)};
        },
    }),
);

// start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});

// console.log(url)