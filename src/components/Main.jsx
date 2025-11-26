import React, { useEffect, useRef, useState } from 'react'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { useForm, Controller } from 'react-hook-form'

const STORAGE_KEY = 'myworkshop_todos_v1'

function readTodos(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch(e){ return [] }
}
function writeTodos(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) }
function genId(){ return 't-' + Date.now() + '-' + Math.floor(Math.random()*1000) }

function escapeHtml(s){
    if(!s) return ''
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
}

export default function Main(){
    const [todos, setTodos] = useState(readTodos())
    const [selectedId, setSelectedId] = useState(null)

    const dateRef = useRef(null)
    const fileInputRef = useRef(null)

    // react-hook-form setup
    const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            shortTitle: '',
            description: '',
            dueDate: '',
            assigned: '',
            attachment: null
        }
    })

    // initialize flatpickr on the due date input using Controller via ref callbacks
    useEffect(() => {
        if (!dateRef.current) return
        const fp = flatpickr(dateRef.current, {
            dateFormat: 'd/m/Y',
            allowInput: true,
            onChange: (selectedDates, dateStr)=> {
                setValue('dueDate', dateStr, { shouldValidate: true })
            }
        })
        return () => fp.destroy()
    }, [setValue])

    // persist todos when they change
    useEffect(() => {
        writeTodos(todos)
    }, [todos])

    // helper: read file to dataUrl
    function fileToDataUrl(file){
        return new Promise((res, rej) => {
            const fr = new FileReader()
            fr.onload = () => res(fr.result)
            fr.onerror = () => rej(fr.error)
            fr.readAsDataURL(file)
        })
    }

    function parseDMY(dateStr){
        // expected dd/mm/yyyy
        if(!dateStr) return null
        const parts = dateStr.split('/').map(p=>p.trim())
        if(parts.length !== 3) return null
        const d = parseInt(parts[0],10)
        const m = parseInt(parts[1],10) - 1
        const y = parseInt(parts[2],10)
        if(Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null
        return new Date(y, m, d, 23, 59, 59)
    }

    // submit handler (replaces onAddTodo)
    async function onSubmit(data){
        const titleVal = (data.shortTitle && data.shortTitle.trim()) || (data.title && data.title.trim()) || ''
        if(!titleVal){
            // should be prevented by validation, but keep safety check
            alert('Please enter a title (use Title or short title).')
            return
        }

        let att = null
        const f = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]
        if(f){
            try{
                const dataUrl = await fileToDataUrl(f)
                att = { name: f.name, type: f.type, dataUrl }
            }catch(e){
                console.error('file read error', e)
            }
        }

        const obj = {
            id: genId(),
            title: titleVal,
            description: (data.description || '').trim(),
            dueDate: (data.dueDate || '').trim(),
            assigned: data.assigned || '',
            createdAt: new Date().toISOString(),
            attachment: att
        }

        setTodos(prev => [obj, ...prev])

        // clear form
        reset()
        if(dateRef.current && dateRef.current._flatpickr) dateRef.current._flatpickr.clear()
        if(fileInputRef.current) fileInputRef.current.value = ''
        setSelectedId(null)
    }

    // show details
    function showDetails(id){
        const t = todos.find(x => x.id === id)
        if(!t) return
        setSelectedId(id)
    }

    // delete
    function deleteTodoConfirm(id){
        if(!confirm('Delete this to-do?')) return
        setTodos(prev => prev.filter(x => x.id !== id))
        setSelectedId(null)
    }

    // edit: keeping original prompt-based flow (unchanged)
    function editTodoFlow(id){
        const idx = todos.findIndex(x => x.id === id)
        if(idx === -1) return
        const t = todos[idx]
        const newTitle = prompt('Edit title:', t.title || '')
        if(newTitle === null) return
        const newDesc = prompt('Edit description:', t.description || '')
        if(newDesc === null) return
        const newDue = prompt('Edit due date (dd/mm/yyyy or blank):', t.dueDate || '')
        if(newDue === null) return
        const newAssigned = prompt('Edit assigned person (name) or blank:', t.assigned || '')
        if(newAssigned === null) return

        const replaceFile = confirm('Replace attachment? OK = use file input below then press Save Edit button. Cancel = keep existing.')
        if(replaceFile){
            createTempSaveButton(id, { newTitle, newDesc, newDue, newAssigned })
            alert('Select a file in the Attachments input, then press the Save Edit button that appears.')
            return
        } else {
            setTodos(prev => {
                const copy = [...prev]
                copy[idx] = { ...copy[idx], title: newTitle.trim(), description: newDesc.trim(), dueDate: newDue.trim(), assigned: newAssigned.trim() }
                return copy
            })
            alert('Saved.')
        }
    }

    function createTempSaveButton(id, pending){
        const existing = document.getElementById('tempSaveEditBtn')
        if(existing) existing.remove()

        const btn = document.createElement('button')
        btn.id = 'tempSaveEditBtn'
        btn.className = 'btn btn-sm btn-primary mt-2'
        btn.textContent = 'Save Edit (use attachments input)'

        const fileGroup = fileInputRef.current ? fileInputRef.current.parentNode : document.body
        fileGroup.appendChild(btn)

        btn.onclick = async () => {
            const idx = todos.findIndex(x => x.id === id)
            if(idx === -1) return
            const f = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]
            setTodos(prev => {
                const copy = [...prev]
                if(f){
                    const dataPromise = new Promise(res => {
                        const fr = new FileReader()
                        fr.onload = () => res(fr.result)
                        fr.readAsDataURL(f)
                    })
                    dataPromise.then(dataUrl => {
                        copy[idx] = { ...copy[idx], title: (pending.newTitle || '').trim(), description: (pending.newDesc || '').trim(), dueDate: (pending.newDue || '').trim(), assigned: (pending.newAssigned || '').trim(), attachment: { name: f.name, type: f.type, dataUrl } }
                        writeTodos(copy)
                        setTodos(copy)
                        btn.remove()
                        if(fileInputRef.current) fileInputRef.current.value = ''
                        alert('Saved changes.')
                    })
                    return prev
                } else {
                    copy[idx] = { ...copy[idx], title: (pending.newTitle || '').trim(), description: (pending.newDesc || '').trim(), dueDate: (pending.newDue || '').trim(), assigned: (pending.newAssigned || '').trim() }
                    writeTodos(copy)
                    alert('Saved changes.')
                    btn.remove()
                    if(fileInputRef.current) fileInputRef.current.value = ''
                    return copy
                }
            })
        }
    }

    // toggle list (hide/show items) - keep header always visible
    function toggleList(){
        const el = document.getElementById('todoListItems')
        if(!el) return
        el.classList.toggle('d-none')
    }

    const selectedTodo = todos.find(t => t.id === selectedId)

    return (
        <div className="main-wrapper w-100">
            <h1 className="text-center text-muted mb-3">MY Todo App</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="card p-3 mb-3">
                <div className="mb-2">
                    <label className="form-label">Title:</label>
                    <input type="text" className="form-control" placeholder="Enter title" {...register('title', { required: 'Description is required' })} />
                    {errors.title && <div className="form-text text-danger">{errors.title.message}</div>}
                </div>

                <div className="mb-2">
                    <label className="form-label">Description:</label>
                    <textarea className="form-control" rows="3" placeholder="Description" {...register('description', { required: 'Description is required', minLength: { value: 5, message: 'Description must be at least 5 characters' } })}></textarea>
                    {errors.description && <div className="form-text text-danger">{errors.description.message}</div>}
                </div>

                <div className="row g-2 mb-2">
                    <div className="col-6">
                        <label className="form-label">Due Date:</label>
                        {/* Controller + flatpickr input */}
                        <Controller
                            control={control}
                            name="dueDate"
                            rules={{
                                required: 'Due date is required',
                                validate: (val) => {
                                    const d = parseDMY(val)
                                    if(!d) return 'Enter a valid date in dd/mm/yyyy'
                                    const now = new Date()
                                    // compare dates at end of day to allow choosing today? requirement: future date -> strictly after today
                                    if(d <= now) return 'Due date must be in the future'
                                    return true
                                }
                            }}
                            render={({ field }) => (
                                <input type="text" ref={el => { dateRef.current = el; field.ref && field.ref(el); }} className="form-control" placeholder="dd/mm/yyyy" autoComplete="off" onBlur={field.onBlur} />
                            )}
                        />
                        {errors.dueDate && <div className="form-text text-danger">{errors.dueDate.message}</div>}
                    </div>

                    <div className="col-6">
                        <label className="form-label">Assigned To Person (optional):</label>
                        <select className="form-select" {...register('assigned')}>
                            <option value="">--Select Person (optional)--</option>
                            <option value="Lalita">Lalita</option>
                            <option value="Simon">Simon</option>
                            <option value="Avyaan">Avyaan</option>
                        </select>
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label">Attachments</label>
                    <div className="input-group">
                        <input type="file" className="form-control" ref={fileInputRef} accept="image/png, image/jpeg" />
                        <button className="btn btn-outline-secondary" type="button" onClick={() => { if(fileInputRef.current) fileInputRef.current.value=''; }}>×</button>
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label">Short Title (optional):</label>
                    <input type="text" className="form-control" placeholder="Short title" {...register('shortTitle', { maxLength: { value: 40, message: 'Max 40 characters' } })} />
                    {errors.shortTitle && <div className="form-text text-danger">{errors.shortTitle.message}</div>}
                </div>

                <div className="text-end">
                    <button className="btn btn-primary" type="submit">+ Add Todo</button>
                </div>
            </form>

            {/* List card */}
            <div className="card">
                <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Todos</h5>
                        <div>
                            <i className="bi bi-funnel me-2 clickable" title="Filter (not implemented)"></i>
                            <i id="toggleList" className="bi bi-plus-circle clickable" title="Toggle list" onClick={toggleList}></i>
                        </div>
                    </li>
                </ul>

                {/* items */}
                <div id="todoListItems">
                    {todos.length === 0 ? (
                        <div className="list-group-item text-muted">No todos yet.</div>
                    ) : (
                        todos.map(t => (
                            <div key={t.id} className="list-group-item" onClick={(e) => { if(e.target.closest('.action-edit') || e.target.closest('.action-delete')) return; showDetails(t.id) }}>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="mb-1" dangerouslySetInnerHTML={{__html: escapeHtml(t.title || '(No title)')}}></h6>
                                        <p className="mb-1 small text-muted">{ (t.description || '').slice(0,120) }</p>
                                        <div className="d-flex align-items-center gap-2">
                                            <p className="mb-0"><strong>Due:</strong> {t.dueDate || '-'}</p>
                                            <span className="badge bg-info text-dark"><i className="bi bi-person-circle me-1"></i> {t.assigned || '-'}</span>
                                            <span className="badge bg-secondary"><i className="bi bi-paperclip me-1"></i> {t.attachment ? '1 Attachment' : '0'}</span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <p className="small text-muted mb-1">Created: {new Date(t.createdAt).toLocaleString()}</p>
                                        <div>
                                            <i className="bi bi-pencil me-2 action-edit clickable" title="Edit" onClick={(ev)=>{ ev.stopPropagation(); editTodoFlow(t.id); }}></i>
                                            <i className="bi bi-trash me-2 action-delete clickable" title="Delete" onClick={(ev)=>{ ev.stopPropagation(); deleteTodoConfirm(t.id); }}></i>
                                            <i className="bi bi-three-dots-vertical"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Details card */}
            <div id="todoDetailCard" className={`card mt-3 ${selectedTodo ? '' : 'd-none'}`}>
                <div className="card-body">
                    <h5 id="detailTitle" className="card-title">{selectedTodo ? (selectedTodo.title || '(No title)') : 'Select a To-Do'}</h5>
                    <p id="detailDesc" className="card-text">{selectedTodo ? selectedTodo.description : ''}</p>
                    <p className="mb-1"><strong>Due:</strong> <span id="detailDue">{selectedTodo ? (selectedTodo.dueDate || '-') : '-'}</span></p>
                    <p className="mb-1"><strong>Assigned:</strong> <span id="detailAssigned">{selectedTodo ? (selectedTodo.assigned || '-') : '-'}</span></p>

                    <div id="detailAttachments">
                        {selectedTodo && selectedTodo.attachment && selectedTodo.attachment.dataUrl ? (
                            <div>
                                <div>Attachment: {selectedTodo.attachment.name || ''}</div>
                                {selectedTodo.attachment.type && selectedTodo.attachment.type.startsWith('image') ? (
                                    <img src={selectedTodo.attachment.dataUrl} alt="attachment" className="attachment-thumb mt-2" />
                                ) : (
                                    <a href={selectedTodo.attachment.dataUrl} target="_blank" rel="noreferrer">Open attachment</a>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-3">
                        <button id="detailEdit" className="btn btn-sm btn-warning me-2" onClick={() => selectedTodo && editTodoFlow(selectedTodo.id)}>Edit</button>
                        <button id="detailDelete" className="btn btn-sm btn-danger" onClick={() => selectedTodo && deleteTodoConfirm(selectedTodo.id)}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
