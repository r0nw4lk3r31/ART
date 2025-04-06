
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, Edit, Calendar, X, Save, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import BaseModule from './BaseModule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string; // ISO date string format
  dueDateFormatted?: string; // Human-readable format
  notes?: string; // Additional notes for the todo
  createdAt: string; // ISO date string format for creation date
  createdAtFormatted?: string; // Human-readable format for creation date
}

interface TodoModuleProps {
  frameId: string;
  isTargeted: boolean;
}

const TodoModule = ({ frameId, isTargeted }: TodoModuleProps) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newTodoNotes, setNewTodoNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [viewingTodo, setViewingTodo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error);
        toast.error('Failed to load saved tasks');
      }
    } else {
      // Set default todos if none exist
      const defaultTodos: Todo[] = [
        { 
          id: '1', 
          text: 'Prepare presentation for meeting', 
          completed: false, 
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          dueDateFormatted: 'Tomorrow',
          createdAt: new Date().toISOString(),
          createdAtFormatted: 'Today'
        },
        { 
          id: '2', 
          text: 'Reply to emails', 
          completed: false, 
          priority: 'medium',
          dueDate: new Date().toISOString().split('T')[0], // Today
          dueDateFormatted: 'Today',
          createdAt: new Date().toISOString(),
          createdAtFormatted: 'Today'
        },
        { 
          id: '3', 
          text: 'Book train tickets for Brussels meeting', 
          completed: false, 
          priority: 'high',
          dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
          dueDateFormatted: 'In 2 days',
          createdAt: new Date().toISOString(),
          createdAtFormatted: 'Today'
        }
      ];
      setTodos(defaultTodos);
      localStorage.setItem('todos', JSON.stringify(defaultTodos));
    }
  }, []);
  
  // Save todos to localStorage whenever they change
  useEffect(() => {
    // First remove the old value to ensure the storage event is triggered
    localStorage.removeItem('todos');
    
    // Then set the new value
    localStorage.setItem('todos', JSON.stringify(todos));
    
    // Manually dispatch a storage event to notify other components
    // This is needed because localStorage events don't fire in the same window that makes the change
    const storageEvent = new StorageEvent('storage', {
      key: 'todos',
      newValue: JSON.stringify(todos),
      oldValue: null,
      storageArea: localStorage,
      url: window.location.href
    });
    window.dispatchEvent(storageEvent);
    
    // We'll use localStorage for now, but in the future we could add
    // integration with Electron API if needed
  }, [todos]);
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const formattedDueDate = newTodoDueDate ? formatDate(newTodoDueDate) : undefined;
    
    const now = new Date();
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText,
      completed: false,
      priority: newTodoPriority,
      dueDate: newTodoDueDate,
      dueDateFormatted: formattedDueDate,
      notes: newTodoNotes.trim() || undefined,
      createdAt: now.toISOString(),
      createdAtFormatted: 'Today'
    };

    setTodos([newTodo, ...todos]);
    setNewTodoText('');
    setNewTodoPriority('medium');
    setNewTodoDueDate('');
    setNewTodoNotes('');
    
    toast.success('Task added');
  };
  
  const viewTodoDetails = (todo: Todo) => {
    setViewingTodo(todo.id);
  };
  
  const closeDetails = () => {
    setViewingTodo(null);
  };

  const toggleTodoCompleted = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const startEditing = (todo: Todo) => {
    // Store if we were viewing this todo to return to detail view after editing
    const wasViewing = viewingTodo === todo.id;
    
    // Store the ID if we were viewing this todo
    if (wasViewing) {
      // We'll use this to return to detail view after editing
      localStorage.setItem('wasViewingTodo', todo.id);
      setViewingTodo(null);
    } else {
      localStorage.removeItem('wasViewingTodo');
    }
    
    // Set editing state
    setEditingTodo(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority);
    setEditDueDate(todo.dueDate || '');
    setEditNotes(todo.notes || '');
  };
  
  const cancelEditing = () => {
    // Check if we were viewing this todo before editing
    const wasViewingId = localStorage.getItem('wasViewingTodo');
    
    // Clear editing state
    setEditingTodo(null);
    setEditText('');
    setEditPriority('medium');
    setEditDueDate('');
    setEditNotes('');
    
    // Return to detail view if we were viewing this todo before editing
    if (wasViewingId) {
      setViewingTodo(wasViewingId);
      localStorage.removeItem('wasViewingTodo');
    }
  };
  
  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    
    // Check if we were viewing this todo before editing
    const wasViewingId = localStorage.getItem('wasViewingTodo');
    
    const formattedDueDate = editDueDate ? formatDate(editDueDate) : undefined;
    
    // Update the todo (preserving createdAt and other fields)
    setTodos(todos.map(todo => 
      todo.id === id ? {
        ...todo, // Preserve all existing fields including createdAt
        text: editText,
        priority: editPriority,
        dueDate: editDueDate,
        dueDateFormatted: formattedDueDate,
        notes: editNotes.trim() || undefined
      } : todo
    ));
    
    // Clear editing state
    setEditingTodo(null);
    setEditText('');
    setEditPriority('medium');
    setEditDueDate('');
    setEditNotes('');
    
    // Return to detail view if we were viewing this todo before editing
    if (wasViewingId && wasViewingId === id) {
      setViewingTodo(id);
      localStorage.removeItem('wasViewingTodo');
    }
    
    // Show success message
    toast.success('Task updated');
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    toast.success('Task deleted');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // Find the todo being viewed
  const viewedTodo = viewingTodo ? todos.find(todo => todo.id === viewingTodo) : null;

  return (
    <BaseModule
      frameId={frameId}
      isTargeted={isTargeted}
      title="Todo"
      icon={<CheckSquare className="h-4 w-4" />}
    >
      {viewingTodo && viewedTodo ? (
        // Detail view
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={closeDetails}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h3 className="text-lg font-medium">Task Details</h3>
          </div>
          
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="flex items-center mb-2">
              <div className={`h-3 w-3 rounded-full ${getPriorityColor(viewedTodo.priority)} mr-2`}></div>
              <span className="text-sm font-medium">{viewedTodo.priority} priority</span>
            </div>
            
            <h2 className="text-xl font-bold mb-2">{viewedTodo.text}</h2>
            
            <div className="flex flex-col space-y-2 mb-4 text-sm">
              {viewedTodo.dueDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Due: {viewedTodo.dueDateFormatted || formatDate(viewedTodo.dueDate)}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created: {viewedTodo.createdAtFormatted || formatDate(viewedTodo.createdAt.split('T')[0])}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Notes</h4>
              {viewedTodo.notes ? (
                <div className="bg-background p-3 rounded-md whitespace-pre-wrap text-sm">
                  {viewedTodo.notes}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm italic">No notes added</div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-auto">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => startEditing(viewedTodo)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button 
              variant={viewedTodo.completed ? "outline" : "default"}
              className="flex-1"
              onClick={() => toggleTodoCompleted(viewedTodo.id)}
            >
              {viewedTodo.completed ? (
                <>
                  <Square className="h-4 w-4 mr-2" /> Mark Incomplete
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" /> Mark Complete
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // List view
        <div className="flex flex-col h-full">
        <form onSubmit={handleAddTodo} className="mb-4">
          <div className="flex space-x-2 mb-2">
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
          </div>
          <div className="flex space-x-2 mb-2">
            <Select value={newTodoPriority} onValueChange={(value) => setNewTodoPriority(value as 'high' | 'medium' | 'low')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
              className="flex-1"
              placeholder="Due date"
            />
          </div>
          <Textarea
            placeholder="Notes (optional)"
            value={newTodoNotes}
            onChange={(e) => setNewTodoNotes(e.target.value)}
            className="w-full h-20 resize-none"
          />
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
                }`}
              >
                {editingTodo === todo.id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex space-x-2">
                      <Select value={editPriority} onValueChange={(value) => setEditPriority(value as 'high' | 'medium' | 'low')}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <Textarea
                      placeholder="Notes (optional)"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full h-20 resize-none mt-2"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(todo.id)}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-start justify-between group">
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
                          <span className="text-xs text-muted-foreground mx-2">•</span>
                          <span className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Created: {todo.createdAtFormatted || formatDate(todo.createdAt.split('T')[0])}
                          </span>
                          
                          {todo.dueDate && (
                            <>
                              <span className="text-xs text-muted-foreground mx-2">•</span>
                              <span className="text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Due: {todo.dueDateFormatted || formatDate(todo.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => viewTodoDetails(todo)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => startEditing(todo)}
                      >
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
                )}
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </BaseModule>
  );
};

export default TodoModule;
