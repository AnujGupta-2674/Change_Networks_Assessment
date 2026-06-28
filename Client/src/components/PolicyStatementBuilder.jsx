import React, { useState, useEffect } from 'react';
import { ACTIONS_BY_NAMESPACE } from '../constants/actions';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const PolicyStatementBuilder = ({ initialStatements = [], onChange }) => {
  const [statements, setStatements] = useState(
    initialStatements.length > 0 ? initialStatements : [{ effect: 'ALLOW', actions: [], resource: '*' }]
  );

  useEffect(() => {
    onChange(statements);
  }, [statements, onChange]);

  const addStatement = () => {
    setStatements([...statements, { effect: 'ALLOW', actions: [], resource: '*' }]);
  };

  const removeStatement = (index) => {
    setStatements(statements.filter((_, i) => i !== index));
  };

  const updateStatement = (index, field, value) => {
    const newStatements = [...statements];
    newStatements[index] = { ...newStatements[index], [field]: value };
    setStatements(newStatements);
  };

  const toggleAction = (index, action) => {
    const statement = statements[index];
    const newActions = statement.actions.includes(action)
      ? statement.actions.filter(a => a !== action)
      : [...statement.actions, action];
    updateStatement(index, 'actions', newActions);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Builder Pane */}
      <div className="space-y-4">
        {statements.map((stmt, index) => (
          <Card key={index} className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="py-3 px-4 bg-neutral-50 dark:bg-neutral-900 border-b flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Statement {index + 1}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeStatement(index)}
                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                disabled={statements.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Effect</label>
                <select 
                  className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-neutral-800 dark:bg-neutral-950"
                  value={stmt.effect}
                  onChange={(e) => updateStatement(index, 'effect', e.target.value)}
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="DENY">DENY</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Actions</label>
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md p-3 h-64 overflow-y-auto bg-white dark:bg-neutral-950 space-y-4">
                  {Object.entries(ACTIONS_BY_NAMESPACE).map(([namespace, actions]) => (
                    <div key={namespace} className="space-y-2">
                      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{namespace}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {actions.map(action => (
                          <label key={action} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 p-1 rounded">
                            <input 
                              type="checkbox" 
                              checked={stmt.actions.includes(action)}
                              onChange={() => toggleAction(index, action)}
                              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
                            />
                            <span>{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button 
          type="button" 
          variant="outline" 
          onClick={addStatement}
          className="w-full border-dashed border-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Statement
        </Button>
      </div>

      {/* JSON Preview Pane */}
      <div>
        <Card className="h-full border-neutral-200 dark:border-neutral-800 sticky top-24">
          <CardHeader className="py-3 px-4 bg-neutral-50 dark:bg-neutral-900 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Live JSON Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-49px)]">
            <pre className="h-full p-4 overflow-auto text-xs font-mono bg-[#1E1E1E] text-[#D4D4D4] m-0 rounded-b-md">
              {JSON.stringify(statements, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolicyStatementBuilder;
