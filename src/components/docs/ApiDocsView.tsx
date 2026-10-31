import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';
import { ExternalLink, Key, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../ui/page-header.tsx';

export const ApiDocsView: React.FC = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="API specs"
        description={<>OpenAPI 3.0.3 specification for the NetGuard endpoints and telemetry ingestion</>}
        actions={<>
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-body text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-medium"
          >
            <span>Open Swagger UI</span>
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <a
            href="/api/docs/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-body text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg font-mono"
          >
            openapi.json
          </a>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              Authentication & role contracts
            </CardTitle>
            <CardDescription className="text-body">
              Bearer JWT tokens are required on protected routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-body font-mono">
            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">Post</span>
                <span className="text-zinc-300">/api/auth/register</span>
                <Badge variant="outline">Public</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-sans">First registrant becomes ADMIN; others default to VIEWER.</p>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">Post</span>
                <span className="text-zinc-300">/api/auth/login</span>
                <Badge variant="outline">Public</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-sans">Returns 24h JWT token and user profile.</p>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-medium">Get</span>
                <span className="text-zinc-300">/api/auth/me</span>
                <Badge variant="secondary">All roles</Badge>
              </div>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-medium">Get</span>
                <span className="text-zinc-300">/api/users</span>
                <Badge variant="destructive">Admin only</Badge>
              </div>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-medium">Patch</span>
                <span className="text-zinc-300">/api/users/:id/role</span>
                <Badge variant="destructive">Admin only</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              Snort ingestion & telemetry API
            </CardTitle>
            <CardDescription className="text-body">
              Strict boundary: "Snort detects. NetGuard manages."
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-body font-mono">
            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">Post</span>
                <span className="text-zinc-300">/api/events/ingest</span>
                <Badge variant="info">Admin / analyst / api-key</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                Accepts single or batch Snort alert logs with signature, priority, and IP/port telemetry.
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-medium">Get</span>
                <span className="text-zinc-300">/api/events</span>
                <Badge variant="secondary">All roles</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                Paginated query with priority, protocol, IP, date range, and text search filters.
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-medium">Get</span>
                <span className="text-zinc-300">/api/events/stats</span>
                <Badge variant="secondary">All roles</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                Aggregates total alert volume, priority distribution, and protocol counts.
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-medium">Get</span>
                <span className="text-zinc-300">/api/events/:id</span>
                <Badge variant="secondary">All roles</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-body font-medium text-zinc-300 mb-2 font-mono">Sample Snort alert ingestion payload (JSON)</h3>
        <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/70 p-3 rounded overflow-x-auto border border-zinc-800">
{`{
  "signatureId": 2001219,
  "generatorId": 1,
  "signatureRevision": 4,
  "signatureMessage": "ET SCAN Potential SSH Scan OUTBOUND",
  "classification": "Attempted Information Leak",
  "priority": 1,
  "protocol": "TCP",
  "sourceIp": "192.168.1.105",
  "sourcePort": 43210,
  "destinationIp": "10.0.0.1",
  "destinationPort": 22,
  "rawPayload": "SSH-2.0-OpenSSH_8.2p1"
}`}
        </pre>
      </div>
    </div>
  );
};
