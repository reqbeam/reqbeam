#!/bin/bash

# Quick script to check Cloud Run logs

echo "📋 Fetching recent logs for reqbeam-auth..."
echo ""

gcloud run services logs read reqbeam-auth \
  --region us-central1 \
  --limit 100 \
  --project delta-lore-397512

echo ""
echo "💡 To stream logs in real-time:"
echo "   gcloud run services logs tail reqbeam-auth --region us-central1"

