#!/bin/bash
sed -i 's/app.get('\''\/api\/quick-replies'\'', (req, res) => {/app.get('\''\/api\/quick-replies'\'', async (req, res) => {/' server.ts
sed -i 's/res.json({ success: true, quickReplies: getQuickReplies() });/const quickReplies = await getQuickReplies();\n    res.json({ success: true, quickReplies });/' server.ts

sed -i 's/app.post('\''\/api\/quick-replies'\'', (req, res) => {/app.post('\''\/api\/quick-replies'\'', async (req, res) => {/' server.ts
sed -i 's/const qr = createQuickReply({ title, content });/const qr = await createQuickReply({ title, content });/' server.ts

sed -i 's/app.put('\''\/api\/quick-replies\/:id'\'', (req, res) => {/app.put('\''\/api\/quick-replies\/:id'\'', async (req, res) => {/' server.ts
sed -i 's/const qr = updateQuickReply(req.params.id, { title, content });/const qr = await updateQuickReply(req.params.id, { title, content });/' server.ts

sed -i 's/app.delete('\''\/api\/quick-replies\/:id'\'', (req, res) => {/app.delete('\''\/api\/quick-replies\/:id'\'', async (req, res) => {/' server.ts
sed -i 's/const deleted = deleteQuickReply(req.params.id);/const deleted = await deleteQuickReply(req.params.id);/' server.ts
