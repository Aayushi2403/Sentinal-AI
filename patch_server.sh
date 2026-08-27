#!/bin/bash
sed -i 's/app.get('\''\/api\/tickets'\'', (req, res) => {/app.get('\''\/api\/tickets'\'', async (req, res) => {/' server.ts
sed -i 's/const tickets = getTickets(/const tickets = await getTickets(/' server.ts

sed -i 's/app.get('\''\/api\/tickets\/:id'\'', (req, res) => {/app.get('\''\/api\/tickets\/:id'\'', async (req, res) => {/' server.ts
sed -i 's/const ticket = getTicketById(req.params.id);/const ticket = await getTicketById(req.params.id);/' server.ts

sed -i 's/app.patch('\''\/api\/tickets\/:id'\'', (req, res) => {/app.patch('\''\/api\/tickets\/:id'\'', async (req, res) => {/' server.ts
sed -i 's/const updated = updateTicket(req.params.id, req.body);/const updated = await updateTicket(req.params.id, req.body);/' server.ts

sed -i 's/app.post('\''\/api\/tickets\/:id\/reply'\'', (req, res) => {/app.post('\''\/api\/tickets\/:id\/reply'\'', async (req, res) => {/' server.ts
sed -i 's/const updated = addMessageToTicket(/const updated = await addMessageToTicket(/' server.ts

sed -i 's/app.get('\''\/api\/metrics'\'', (req, res) => {/app.get('\''\/api\/metrics'\'', async (req, res) => {/' server.ts
sed -i 's/const metrics = getHelpdeskMetrics();/const metrics = await getHelpdeskMetrics();/' server.ts
