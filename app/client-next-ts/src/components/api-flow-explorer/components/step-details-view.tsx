// StepDetailsView component for displaying step details
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DataTable, EmptyRow, HighlightCode } from './ui-components';
import { type ArazzoWorkflowStep, type HttpVerb, HTTP_VERB_STYLES, type OasOperationInfo } from '../types';
import { 
  detectHttpVerb, 
  extractValidationConstraints, 
  flattenJsonPaths, 
  getSchemaForPath, 
  getStepPayload 
} from '../utils/schema-utils';

interface StepDetailsViewProps {
  selectedStep: ArazzoWorkflowStep | null;
  selectedOasOperation?: OasOperationInfo;
  oasSpec: any;
}

/**
 * StepDetailsView component for displaying detailed information about a workflow step
 */
export const StepDetailsView: React.FC<StepDetailsViewProps> = ({ 
  selectedStep,
  selectedOasOperation,
  oasSpec
}) => {
  // Format schema data for display
  const formatSchema = (schema: any): string => {
    if (!schema) return 'No schema defined';
    try {
      return JSON.stringify(schema, null, 2);
    } catch {
      return 'Invalid schema';
    }
  };
  
  return (
    <Tabs defaultValue="step" className="w-full h-full flex flex-col max-h-full">
      <div className="shrink-0 bg-jpm-brown-100 border-b border-jpm-brown-300 px-2 sm:px-4">
        <TabsList className="bg-transparent h-10 p-0 gap-1">
          <TabsTrigger
            value="step"
            className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
          >
            Step JSON
          </TabsTrigger>
          {detectHttpVerb(selectedStep?.operationId) === 'POST' &&
            !!getStepPayload(selectedStep ?? undefined) && (
              <>
                <TabsTrigger
                  value="payload-json"
                  className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                >
                  Payload JSON
                </TabsTrigger>
                <TabsTrigger
                  value="payload-table"
                  className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
                >
                  Payload Table
                </TabsTrigger>
              </>
            )}
          <TabsTrigger
            value="meta"
            className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
          >
            Meta
          </TabsTrigger>
          {selectedOasOperation && (
            <TabsTrigger
              value="api"
              className="data-[state=active]:bg-white data-[state=active]:text-jpm-brown-900"
            >
              API Details
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-4 max-h-[calc(100%-50px)]">
        <TabsContent value="step" className="m-0 h-full overflow-auto">
          <HighlightCode 
            code={selectedStep
              ? JSON.stringify(selectedStep, null, 2)
              : '// Select a step on the left'
            }
            language="json"
          />
        </TabsContent>
        
        <TabsContent value="payload-json" className="m-0 h-full overflow-auto">
          <HighlightCode 
            code={getStepPayload(selectedStep ?? undefined)
              ? JSON.stringify(getStepPayload(selectedStep ?? undefined), null, 2)
              : '// No payload for this step'
            }
            language="json"
          />
        </TabsContent>
        
        <TabsContent value="payload-table" className="m-0 h-full overflow-auto">
          {(() => {
            const payload = getStepPayload(selectedStep ?? undefined);
            if (!payload)
              return (
                <div className="text-sm text-muted-foreground">
                  No payload for this step.
                </div>
              );
            
            const rows = flattenJsonPaths(payload);
            
            // Extract validation details for each field from the OAS spec
            const rowsWithValidation = rows.map(row => {
              // Get schema for this path
              const schema = getSchemaForPath(
                row.path, 
                oasSpec, 
                selectedStep?.operationId
              );
              
              // Extract validation constraints
              const validationText = extractValidationConstraints(schema);
              
              return {
                ...row,
                validation: validationText,
                schemaInfo: schema
              };
            });
            
            return (
              <DataTable headers={['JSON Path', 'Validation', 'Description']}>
                {rowsWithValidation.map((r) => (
                  <tr
                    key={r.path}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">
                      {r.path}
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {r.validation ? (
                        <div className="text-xs text-muted-foreground">
                          {r.validation}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {r.schemaInfo?.description || ''}
                    </td>
                  </tr>
                ))}
              </DataTable>
            );
          })()}
        </TabsContent>
        
        <TabsContent value="meta" className="m-0 h-full overflow-auto">
          {(() => {
            const s = selectedStep as any;
            if (!s)
              return (
                <div className="text-sm text-muted-foreground">
                  Select a step to view metadata.
                </div>
              );
            const success = Array.isArray(s.successCriteria)
              ? s.successCriteria.map((c: any) => c.condition)
              : [];
            const onSuccess = Array.isArray(s.onSuccess)
              ? s.onSuccess.map((c: any) => c.reference)
              : [];
            const onFailure = Array.isArray(s.onFailure)
              ? s.onFailure.map((c: any) => c.reference)
              : [];
            const outputs = s.outputs || {};
            return (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium mb-2">
                    Success Criteria
                  </div>
                  <DataTable headers={['Condition']}>
                    {success.length === 0 ? (
                      <EmptyRow />
                    ) : (
                      success.map((cond: string, idx: number) => (
                        <tr
                          key={idx}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 font-mono text-xs">
                            {cond}
                          </td>
                        </tr>
                      ))
                    )}
                  </DataTable>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">
                      On Success
                    </div>
                    <DataTable headers={['Reference']}>
                      {onSuccess.length === 0 ? (
                        <EmptyRow />
                      ) : (
                        onSuccess.map((ref: string, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 font-mono text-xs">
                              {ref}
                            </td>
                          </tr>
                        ))
                      )}
                    </DataTable>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">
                      On Failure
                    </div>
                    <DataTable headers={['Reference']}>
                      {onFailure.length === 0 ? (
                        <EmptyRow />
                      ) : (
                        onFailure.map((ref: string, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 font-mono text-xs">
                              {ref}
                            </td>
                          </tr>
                        ))
                      )}
                    </DataTable>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">
                    Outputs
                  </div>
                  <DataTable headers={['Name', 'Value']}>
                    {Object.keys(outputs).length === 0 ? (
                      <EmptyRow colSpan={2} />
                    ) : (
                      Object.entries(outputs).map(
                        ([k, v]: [string, any]) => (
                          <tr
                            key={k}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 pr-4 text-xs">{k}</td>
                            <td className="py-2 font-mono text-[11px] text-muted-foreground">
                              {String(v)}
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </DataTable>
                </div>
              </div>
            );
          })()}
        </TabsContent>
        
        <TabsContent value="api" className="m-0 h-full overflow-auto">
          {(() => {
            if (!selectedOasOperation) {
              return (
                <div className="text-sm text-muted-foreground">
                  No API details available for this step.
                </div>
              );
            }
            
            // Extract operation details
            const { 
              verb, 
              path, 
              summary, 
              description, 
              parameters = [], 
              requestBody,
              responses = {} 
            } = selectedOasOperation;
            
            // Get content type and schema from request body
            let requestContentType = '';
            let requestSchema = null;
            
            if (requestBody?.content) {
              // Get the first content type (usually application/json)
              const contentTypes = Object.keys(requestBody.content);
              if (contentTypes.length > 0) {
                requestContentType = contentTypes[0];
                requestSchema = requestBody.content[requestContentType]?.schema;
              }
            }
            
            return (
              <div className="space-y-6">
                {/* Operation Overview */}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={cn(
                        'text-xs px-2 py-1 border',
                        HTTP_VERB_STYLES[verb as HttpVerb]
                      )}
                      variant="outline"
                    >
                      {verb}
                    </Badge>
                    <span className="text-sm font-mono">{path}</span>
                  </div>
                  
                  {(summary || description) && (
                    <div className="mt-3 text-sm">
                      {summary && <p className="font-medium mb-1">{summary}</p>}
                      {description && <p className="text-muted-foreground">{description}</p>}
                    </div>
                  )}
                </div>
                
                {/* Parameters */}
                {parameters.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Parameters</div>
                    <DataTable headers={['Name', 'Location', 'Type', 'Required', 'Description']}>
                      {parameters.map((param: any, idx: number) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">{param.name}</td>
                          <td className="py-2 pr-4 text-xs">{param.in}</td>
                          <td className="py-2 pr-4 text-xs">
                            {param.schema?.type || 'object'}
                            {param.schema?.format && ` (${param.schema.format})`}
                          </td>
                          <td className="py-2 pr-4 text-xs">
                            {param.required ? 'Yes' : 'No'}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {param.description || ''}
                          </td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>
                )}
                
                {/* Request Body */}
                {requestBody && (
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Request Body {requestContentType && `(${requestContentType})`}
                    </div>
                    {requestBody.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {requestBody.description}
                      </p>
                    )}
                    {requestSchema && (
                      <div className="bg-white rounded-lg border p-3 overflow-auto max-h-[300px]">
                        <HighlightCode
                          code={formatSchema(requestSchema)}
                          language="json"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Response Codes */}
                {Object.keys(responses).length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Responses</div>
                    <DataTable headers={['Status', 'Description', 'Content Type']}>
                      {Object.entries(responses).map(([status, respObj]: [string, any]) => {
                        const contentTypes = respObj.content 
                          ? Object.keys(respObj.content).join(', ') 
                          : '';
                        
                        return (
                          <tr key={status} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-xs">
                              {status}
                              {status === '200' && (
                                <Badge className="ml-2 bg-green-100 text-green-800 border-green-300" variant="outline">
                                  OK
                                </Badge>
                              )}
                              {status.startsWith('4') && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300" variant="outline">
                                  Error
                                </Badge>
                              )}
                              {status.startsWith('5') && (
                                <Badge className="ml-2 bg-red-100 text-red-800 border-red-300" variant="outline">
                                  Error
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-xs">
                              {respObj.description || ''}
                            </td>
                            <td className="py-2 text-xs font-mono">
                              {contentTypes}
                            </td>
                          </tr>
                        );
                      })}
                    </DataTable>
                    
                    {/* Example Response Schema */}
                    {responses['200']?.content?.['application/json']?.schema && (
                      <div className="mt-4">
                        <div className="text-xs font-medium mb-2">
                          Success Response Schema
                        </div>
                        <div className="bg-white rounded-lg border p-3 overflow-auto max-h-[200px]">
                          <HighlightCode
                            code={formatSchema(responses['200'].content['application/json'].schema)}
                            language="json"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>
      </div>
    </Tabs>
  );
};
