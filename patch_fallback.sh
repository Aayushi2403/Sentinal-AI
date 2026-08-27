#!/bin/bash
sed -i 's/groundedArticles: \[\],/groundedArticles: \[\],\n    urgencyScore: 5,\n    urgencyReasoning: "Fallback",\n    summary: "Fallback summary",\n    automatedResolutionPossible: false,\n    processedAt: new Date().toISOString(),\n    processingTimeMs: 10,/' server/ticketStore.ts
