
import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, Edit, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseModule from './BaseModule';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface TodoModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const TodoModule = ({ frameId, isTargeted }: TodoModuleProps) => {
  const [todos, setTodos] = useState<Todo[]>([
    { 
      id: '1', 
      text: 'Prepare presentation for meeting', 
      completed: false, 
      priority: 'high',
      dueDate: 'Today' 
    },
    { 
      id: '2', 
      text: 'Reply to emails', 
      completed: false, 
      priority: 'medium',
      dueDate: 'Today'
    },
    { 
      id: '3', 
      text: 'Book train tickets for Brussels meeting', 
      completed: false, 
      priority: 'high',
      dueDate: 'Tomorrow'
    },
    { 
      id: '4', 
      text: 'Call the client', 
      completed: true, 
      priority: 'medium' 
    },
    { 
      id: '5', 
      text: 'Review project requirements', 
      completed: true, 
      priority: 'low' 
    }
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText,
      completed: false,
      priority: 'medium',
    };

    setTodos([newTodo, ...todos]);
    setNewTodoText('');
  };

  const toggleTodoCompleted = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Todo"
      icon={<CheckSquare className="h-4 w-4" />}
    >
      <div className="flex flex-col h-full">
        <form onSubmit={handleAddTodo} className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newTodoText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'active' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button 
              variant={filter === 'completed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' ? 'No tasks yet' : 
               filter === 'active' ? 'No active tasks' : 'No completed tasks'}
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div 
                key={todo.id} 
                className={`p-3 rounded-md ${
                  todo.completed ? 'bg-muted/40' : 'bg-muted'
                } flex items-start justify-between group`}
              >
                <div className="flex items-start">
                  <button
                    onClick={() => toggleTodoCompleted(todo.id)}
                    className="mt-0.5 mr-3 text-muted-foreground hover:text-foreground"
                  >
                    {todo.completed ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <div className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.text}
                    </div>
                    <div className="flex items-center mt-1">
                      <div className={`h-2 w-2 rounded-full ${getPriorityColor(todo.priority)} mr-2`}></div>
                      <span className="text-xs text-muted-foreground">{todo.priority}</span>
                      {todo.dueDate && (
                        <>
                          <span className="text-xs text-muted-foreground mx-2">•</span>
                          <span className="text-xs text-muted-foreground">{todo.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-6 w-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BaseModule>
  );
};

export default TodoModule;
