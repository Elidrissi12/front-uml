import React, { useEffect, useState } from 'react';
import {dia, shapes } from 'jointjs';
import './Style.css';
    const UmlCanvas = () => {
        const [selectedClass, setSelectedClass] = useState(null); // For editing/deleting
        const [graph, setGraph] = useState(null);
        const [paper, setPaper] = useState(null);
        const [classes, setClasses] = useState([]);
        const [className, setClassName] = useState('');
        const [sourceClassId, setSourceClassId] = useState(null);
        const [targetClassId, setTargetClassId] = useState(null);
        const [relationshipType, setRelationshipType] = useState('Association');
        const [sourceCardinality, setSourceCardinality] = useState('');
        const [targetCardinality, setTargetCardinality] = useState('');
        const [attributeName, setAttributeName] = useState('');
        const [attributeType, setAttributeType] = useState('');
        const [attributeList, setAttributeList] = useState([]);
        const [methodName, setMethodName] = useState('');
        const [methodType, setMethodType] = useState('');
        const [methodList, setMethodList] = useState([]);
        const [showPopup, setShowPopup] = useState(false);
        const [showPopup2, setShowPopup2] = useState(false);
        const [popupMode, setPopupMode] = useState('');
        const [showDeletePopup, setShowDeletePopup] = useState(false);
        const [selectedClassToDelete, setSelectedClassToDelete] = useState(null);
        const [generatedCode, setGeneratedCode] = useState('');
        const [showPopup1, setShowPopup1] = useState(false);
        const [relationships, setRelationships] = useState([]);
        const [selectedRelationship, setSelectedRelationship] = useState(null);
        const [classType, setClassType] = useState('');
        useEffect(() => {
            const newGraph = new dia.Graph();
            setGraph(newGraph);

            const newPaper = new dia.Paper({
                el: document.getElementById('canvas'), // The canvas element where the graph is rendered
                model: newGraph, // The graph model
                width: 800, // Width of the paper
                height: 600, // Height of the paper
                gridSize: 20, // Distance between dots in the grid
                drawGrid: {
                    name: 'dot', // Use the 'dot' grid style
                    args: { color: 'gray', thickness: 1 } // Customize the dots
                },
                interactive: true, // Allow interaction with the paper
            });
            setPaper(newPaper);
            newPaper.on('cell:pointerdblclick', (cellView) => {
                const cell = cellView.model;
                if (cell.isElement()) {
                    setSelectedClass(cell);
                    setClassName(cell.get('name') || '');
                    const attributes = (cell.get('attributes') || []).map(attr => {
                        const [name, type] = attr.split(': ');
                        return { name, type };
                    });
                    setAttributeList(attributes);
    
                    const methods = (cell.get('methods') || []).map(method => {
                        const [name, type] = method.split('(): ');
                        return { name, type };
                    });
                    setMethodList(methods);
    
                    setPopupMode('edit');
                    // extractCanvasData(newPaper);
                    setShowPopup(true);
                }
            });
        }, []);
        const fetchDataFromPaper = () => {
            if (!paper) {
              console.error('Paper is not initialized.');
              return [];
            }
          
            const graph = paper.model;
            const elements = graph.getElements();
          
            const classes = elements.map((element) => {
              const className = element.get('name') || 'UnnamedClass';
              const attrs = element.get('attributes') || [];
              const meths = element.get('methods') || [];
          
              const attributes = attrs.map((attr) => {
                if (typeof attr === 'string') {
                  const [name, type] = attr.split(': ').map((v) => v.trim());
                  return { name: name || 'UnnamedAttribute', type: type || 'Object' };
                } else if (typeof attr === 'object') {
                  return { name: attr.name || 'UnnamedAttribute', type: attr.type || 'Object' };
                }
                return { name: 'UnnamedAttribute', type: 'Object' };
              });
          
              const methods = meths.map((method) => {
                if (typeof method === 'string') {
                  const [name, type] = method.split('(): ').map((v) => v.trim());
                  return { name: name || 'UnnamedMethod', type: type || 'void' };
                } else if (typeof method === 'object') {
                  return { name: method.name || 'UnnamedMethod', type: method.type || 'void' };
                }
                return { name: 'UnnamedMethod', type: 'void' };
              });
          
              return { className, attributes, methods };
            });
          
            return classes;
          };
          
          
          
          const onGenerateCode = (language) => {
            const classes = fetchDataFromPaper();
        
            if (!classes.length) {
                alert('No classes found to generate code.');
                return;
            }
            const relationshipMap = {};
            classes.forEach(({ className, relationships }) => {
                if (relationships) {
                    relationships.forEach((relation) => {
                        if (relation.type === 'inheritance') {
                            relationshipMap[relation.child] = relation.parent;
                        }
                    });
                }
            });
        
            let code = '';
        
            classes.forEach(({ className, attributes, methods }) => {
                const inheritsFrom = relationshipMap[className];
                const inherits = inheritsFrom ? (language === 'Python' ? `(${inheritsFrom})` : ` extends ${inheritsFrom}`) : '';
                if (language === 'Java') {
                    code += `public class ${className}${inherits} {\n`;
                    attributes.forEach((attr) => {
                        code += `    private ${attr.type} ${attr.name};\n`;
                    });
                    code += '\n';
                    methods.forEach((method) => {
                        code += `    public ${method.type} ${method.name}() {\n        // TODO: Implement\n    }\n`;
                    });
                    code += '}\n\n';
                } else if (language === 'PHP') {
                    code += `<?php\n\nclass ${className}${inherits ? ` extends ${inheritsFrom}` : ''} {\n`;
                    attributes.forEach((attr) => {
                        code += `    private $${attr.name}; // Type: ${attr.type}\n`;
                    });
                    code += '\n';
                    methods.forEach((method) => {
                        code += `    public function ${method.name}() {\n        // TODO: Implement\n    }\n`;
                    });
                    code += '}\n?>\n';
                } else if (language === 'Python') {
                    code += `class ${className}${inherits}:\n`;
                    code += '    def __init__(self):\n';
                    attributes.forEach((attr) => {
                        code += `        self.${attr.name} = None  # Type: ${attr.type}\n`;
                    });
                    code += '\n';
                    methods.forEach((method) => {
                        code += `    def ${method.name}(self):\n        # TODO: Implement\n        pass\n`;
                    });
                    code += '\n\n';
                }
            });
            setGeneratedCode(code.trim());
            setShowPopup1(true);
        };
        const closePopup = () => {
            setShowPopup1(false);
            setGeneratedCode('');
          };
        const addAttribute = () => {
            if (!attributeName || !attributeType) {
                alert("Both name and type are required for an attribute.");
                return;
            }
            setAttributeList(prev => [...prev, { name: attributeName, type: attributeType }]);
            setAttributeName('');
            setAttributeType('');
        };
        const addMethod = () => {
            if (!methodName || !methodType) {
                alert("Both name and type are required for a method.");
                return;
            }
            setMethodList((prev) => [...prev, { name: methodName, type: methodType }]);
            setMethodName('');
            setMethodType('');
        };
        const addClass = () => {
            if (!className) return alert("Class name is required.");
            const umlClass = new shapes.uml.Class({
                position: { x: Math.random() * 600, y: Math.random() * 400 },
                size: { width: 200, height: 120 },
                name: className,
                attributes: attributeList.map(attr => `${attr.name}: ${attr.type}`),
                methods: methodList.map((method) => `${method.name}(): ${method.type}`),
            });
            graph.addCell(umlClass);
            setClasses((prev) => [...prev, umlClass]);
            resetInputs();
        };
        const resetInputs = () => {
            setClassName('');
            setMethodList([]);
            setAttributeList([]);
            setAttributeName('');
            setAttributeType('');
            setMethodName('');
            setMethodType('');
            setSourceClassId('');
            setSourceCardinality('');
            setTargetClassId('');
            setTargetCardinality('');
            setRelationshipType('Association');
        };
        const saveEdits = () => {
            if (selectedClass) {
                selectedClass.set({
                    name: className,
                    attributes: attributeList.map((attr) => `${attr.name}: ${attr.type}`),
                    methods: methodList.map((method) => `${method.name}(): ${method.type}`),
                });
                const text = `
                    <<${className}>>\n
                    ${attributeList.map((attr) => `${attr.name}: ${attr.type}`).join('\n')}\n
                    ${methodList.map((method) => `${method.name}(): ${method.type}`).join('\n')}
                `;
                selectedClass.attr('label/text', text);
            setShowPopup(false);
            resetInputs(false);
        };
        }
        const updateAttribute = (index, key, value) => {
            const updatedAttributes = [...attributeList];
            updatedAttributes[index][key] = value;
            setAttributeList(updatedAttributes);
        };
        const updateMethod = (index, key, value) => {
            const updatedMethods = [...methodList];
            updatedMethods[index][key] = value;
            setMethodList(updatedMethods);
        };
        const handlePopupClose = () => {
            setShowPopup(false);
            resetInputs(false);
        };
        const handleDeleteClick = (classToDelete) => {
            setSelectedClassToDelete(classToDelete);
            setShowDeletePopup(true);
        };
        const confirmDelete = () => {
            if (selectedClassToDelete) {
                graph.removeCells([selectedClassToDelete]);
                setClasses(prevClasses => 
                    prevClasses.filter(cls => cls.id !== selectedClassToDelete.id)
                );
            }
            setShowDeletePopup(false);
            setShowPopup(false);
            resetInputs(false);
            setSelectedClassToDelete(null);
        };        
    
        const cancelDelete = () => {
            setShowDeletePopup(false);
            setSelectedClassToDelete(null);
        };
        const deleteAttribute = (index) => {
            setAttributeList((prev) => prev.filter((_, i) => i !== index));
        };
        const deleteMethod = (index) => {
            setMethodList((prev) => prev.filter((_, i) => i !== index));
        };
        const addRelationship = () => {
            if (!sourceClassId || !targetClassId) {
                return alert("Please select both source and target classes.");
            }
            const sourceClass = graph.getCell(sourceClassId);
            const targetClass = graph.getCell(targetClassId);
            if (sourceClass && targetClass) {
                const link = new shapes.standard.Link();
                link.source(sourceClass);
                link.target(targetClass);
                setLinkStyle(link, relationshipType);
                link.appendLabel({
                    attrs: {
                        text: {
                            text: sourceCardinality || '1',
                            fill: 'black',
                        },
                    },
                    position: {
                        distance: 0.2,
                        offset: { x: -10, y: -10 },
                    },
                });
                link.appendLabel({
                    attrs: {
                        text: {
                            text: targetCardinality || '1',
                            fill: 'black',
                        },
                    },
                    position: {
                        distance: 0.8,
                        offset: { x: 10, y: 10 },
                    },
                });
        
                // Add the link to the graph
                link.addTo(graph);
        
                // Create a new relationship object to track
                const newRelationship = {
                    id: link.id, // Use the link's unique ID
                    source: sourceClassId,
                    target: targetClassId,
                    sourceCardinality: sourceCardinality || '1',
                    targetCardinality: targetCardinality || '1',
                    type: relationshipType,
                };
        
                // Update the relationships state
                setRelationships((prevRelationships) => [...prevRelationships, newRelationship]);
    
            } else {
                alert("Source or Target class not found in the graph.");
            }
            resetInputs();
        };
        
        
        

        const setLinkStyle = (link, relationshipType) => {
            const styles = {
                Association: {
                    stroke: '#000',
                    'stroke-width': 2,
                    'stroke-dasharray': '0, 0',
                    'target-marker': {
                        type: 'path',
                        d: 'M 10 -5 0 0 10 5 z', // Arrowhead shape
                        fill: '#000',
                        stroke: '#000',
                        'stroke-width': 2,
                    },
                },
                Composition: {
                    stroke: '#4b0082',
                    'stroke-width': 3,
                    'stroke-dasharray': '5, 5',
                    'target-marker': {
                        type: 'path',
                        d: 'M 15 -7.5 0 0 15 7.5 30 0 z',
                        fill: '#4b0082',
                        stroke: '#4b0082',
                        'stroke-width': 2,
                    },
                },
                Aggregation: {
                    stroke: '#00008b',
                    'stroke-width': 2,
                    'stroke-dasharray': '3, 3',
                    'target-marker': {
                        type: 'path',
                        d: 'M -5 -5 L 5 -5 L 5 5 L -5 5 Z',
                        fill: '#00008b', 
                        stroke: '#00008b',
                        'stroke-width': 1,
                    },
                },
                Dependency: {
                    stroke: '#00008b',
                    'stroke-width': 1.5,
                    'stroke-dasharray': '3, 3',
                    'target-marker': {
                        type: 'path',
                        d: 'M 10 -5 0 0 10 5 z',
                        fill: '#00008b',
                        stroke: '#00008b',
                        'stroke-width': 1.5,
                    },
                },
                Realization: {
                    stroke: '#00008b',
                    'stroke-width': 1.5,
                    'stroke-dasharray': '5, 5',
                    'target-marker': {
                        type: 'path',
                        d: 'M 10 -5 0 0 10 5 z',
                        fill: 'none',
                        stroke: '#00008b',
                        'stroke-width': 1.5,
                    },
                },
                Inheritance: {
                            stroke: '#000', // Line color
                            'stroke-width': 2, // Line width
                            'stroke-dasharray': '5, 5', // Dashed line for visual distinction
                            'target-marker': {
                                type: 'path',
                                d: 'M 0 -10 L 10 0 L 0 10 Z', // Hollow triangle
                                fill: 'none', // No fill for hollow effect
                                stroke: '#000', // Triangle border color
                                'stroke-width': 2, // Triangle border width
                            },
                            text: {
                                text: 'Herritage', // Text to display
                                fill: '#000', // Text color
                                'font-size': 12, // Font size
                                'font-family': 'Arial, sans-serif', // Font family
                            },
                },

            };
        
            // Apply styles based on the relationship type
            link.attr({
                line: styles[relationshipType] || {
                    stroke: 'black',
                    'stroke-width': 2, // Default style
                },
            });
        };
        
        
    const openEditPopup = (rel) => {
        setSelectedRelationship(rel);
        setShowPopup2(true);
    };
    const updateRelationship = () => {
        if (!selectedRelationship.source || !selectedRelationship.target) {
            return alert("Please select both source and target classes.");
        }
    
        const updatedRelationships = relationships.map((rel) => {
            if (rel.id === selectedRelationship.id) {
                return selectedRelationship; // Update the selected relationship
            }
            return rel;
        });
    
        // Update the link in the graph
        const link = graph.getCell(selectedRelationship.id); // Assuming `selectedRelationship.id` corresponds to the link's ID
    
        if (link) {
            const sourceClass = graph.getCell(selectedRelationship.source);
            const targetClass = graph.getCell(selectedRelationship.target);
    
            if (sourceClass && targetClass) {
                // Update the source and target of the link
                link.source(sourceClass);
                link.target(targetClass);
    
                // Update the style based on the relationship type
                setLinkStyle(link, selectedRelationship.type);
    
                // Update cardinalities
                link.label(0, {
                    attrs: {
                        text: {
                            text: selectedRelationship.sourceCardinality || '1', // Default cardinality
                        },
                    },
                });
                link.label(1, {
                    attrs: {
                        text: {
                            text: selectedRelationship.targetCardinality || '1', // Default cardinality
                        },
                    },
                });
            }
        }
    
        // Update the relationships state
        setRelationships(updatedRelationships);
        resetInputs();
        setShowPopup2(false);
    };
        
    
    const deleteSelectedRelationship = () => {
        if (!selectedRelationship) return;
    
        // Find and remove the relationship from the graph
        const link = graph.getCell(selectedRelationship.id);
        if (link) {
            graph.removeCells([link]);
        }
    
        // Update relationships state
        setRelationships((prev) =>
            prev.filter((rel) => rel.id !== selectedRelationship.id)
        );
        resetInputs();
        setShowPopup2(false);
    };
    const closePopup1 = () => {
        resetInputs();
        setShowPopup2(false);
        
      };
         return (
            <>
            
                <div className="toolbarContainer">
                    
                    <button className="toolBtn" onClick={() => onGenerateCode('Java')}>
                        Generate Java Code
                    </button>
                    <button className="toolBtn" onClick={() => onGenerateCode('PHP')}>
                        Generate PHP Code
                    </button>
                    <button className="toolBtn" onClick={() => onGenerateCode('Python')}>
                        Generate Python Code
                    </button>
                    </div>
                    {showPopup1 && (
                        <div className="popup1">
                            <div className="popup-content1">
                                <h3>Generated Code</h3>
                                <pre className="code-preview">{generatedCode}</pre>
                                <button className="close-button" onClick={closePopup}>Close</button>
                            </div>
                        </div>
                    )}
            <div className='form-container'>
            <div className="cont1">
            <div className="input-group">
                <input
                    type="text"
                    placeholder="Class Name"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                />
                <button onClick={addClass}>Add Class</button>
            </div>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Attribute Name"
                        value={attributeName}
                        onChange={(e) => setAttributeName(e.target.value)}
                    />
                    <select
                        value={attributeType}
                        onChange={(e) => setAttributeType(e.target.value)}
                    >
                        <option value="" disabled>Select Attribute Type</option>
                        <option value="String">String</option>
                        <option value="int">int</option>
                        <option value="Boolean">Boolean</option>
                        <option value="double">double</option>
                        <option value="Date">Date</option>
                    </select>
                    <button onClick={addAttribute}>Add Attribute</button>
                </div>
                <div>
                    <ul>
                        {attributeList.map((attr, index) => (
                            <li key={index}>
                                {attr.name}: {attr.type}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Method Name"
                        value={methodName}
                        onChange={(e) => setMethodName(e.target.value)}
                    />
                    <select
                        value={methodType}
                        onChange={(e) => setMethodType(e.target.value)}
                    >
                        <option value="" disabled>Select Return Type</option>
                        <option value="String">String</option>
                        <option value="int">int</option>
                        <option value="Boolean">boolean</option>
                        <option value="double">double</option>
                        <option value="void">void</option>
                    </select>
                    <button onClick={addMethod}>Add Method</button>
                </div>
            <div>
                <ul>
                    {methodList.map((method, index) => (
                        <li key={index}>
                            {method.name}(): {method.type}
                        </li>
                    ))}
                </ul>
            </div>
            </div>
            <div className='cont2'>
                <div className="input-group">
                    <select onChange={(e) => setSourceClassId(e.target.value)} value={sourceClassId}>
                        <option value="">Select Source Class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.attributes.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Source Cardinality"
                        value={sourceCardinality}
                        onChange={(e) => setSourceCardinality(e.target.value)}
                    />
                    <select onChange={(e) => setTargetClassId(e.target.value)} value={targetClassId}>
                        <option value="">Select Target Class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.attributes.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Target Cardinality"
                        value={targetCardinality}
                        onChange={(e) => setTargetCardinality(e.target.value)}
                    />
                    <select onChange={(e) => setRelationshipType(e.target.value)} value={relationshipType}>
                        <option value="Association">Association</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Composition">Composition</option>
                        <option value="Aggregation">Aggregation</option>
                        <option value="Dependency">Dependency</option>
                        <option value="Realization">Realization</option>
                    </select>
                    <button onClick={addRelationship}>Add Relationship</button>

                    <div className="relationship-list">
    <h3>Relationships</h3>
    {relationships.map((rel, index) => {
        const sourceClass = classes.find(cls => cls.id === rel.source);
        const targetClass = classes.find(cls => cls.id === rel.target);

        if (sourceClass?.attributes.name && targetClass?.attributes.name) {
            return (
                <div
                    key={index}
                    className="relationship-item"
                    onClick={() => openEditPopup(rel)}
                >
                    <span>
                        {`${sourceClass.attributes.name} -> ${targetClass.attributes.name}`}
                    </span>
                </div>
            );
        }
        return null;
    })}
</div>
                </div>
                {showPopup2 && (
                    <div className="popup">
                        <div className="popup-content">
                        <h3>Edit Relationship</h3>
                        <select onChange={(e) => setSelectedRelationship({ ...selectedRelationship, source: e.target.value })} value={selectedRelationship.source}>
                            <option value="">Select Source Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.attributes.name}
                                </option>
                            ))}
                        </select>
                        <select onChange={(e) => setSelectedRelationship({ ...selectedRelationship, target: e.target.value })} value={selectedRelationship.target}>
                            <option value="" disa>Select Target Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.attributes.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Source Cardinality"
                            value={selectedRelationship.sourceCardinality}
                            onChange={(e) => setSelectedRelationship({
                                ...selectedRelationship,
                                sourceCardinality: e.target.value,
                            })}
                        />
                        <input
                            type="text"
                            placeholder="Target Cardinality"
                            value={selectedRelationship.targetCardinality}
                            onChange={(e) => setSelectedRelationship({
                                ...selectedRelationship,
                                targetCardinality: e.target.value,
                            })}
                        />
                        <select onChange={(e) => setSelectedRelationship({ ...selectedRelationship, type: e.target.value })} value={selectedRelationship.type}>
                            <option value="Association">Association</option>
                            <option value="Inheritance">Inheritance</option>
                            <option value="Composition">Composition</option>
                            <option value="Aggregation">Aggregation</option>
                            <option value="Dependency">Dependency</option>
                            <option value="Realization">Realization</option>
                        </select>
                        <button onClick={updateRelationship}>Save</button>
                        <button className='delete' onClick={deleteSelectedRelationship}>Delete</button>
                        <button onClick={closePopup1}>Cancel</button>
                    </div>
                    </div>
                )}
            </div>
            <div className="canvas-container">
            <div id="canvas" style={{ height: '100%', width: '100%' }}>
            </div>
        </div>
        {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                    <button className="delete" onClick={() => handleDeleteClick(selectedClass)}>
                    Delete
                </button>
                {showDeletePopup && (
                <div className="popup">
                    <div className="popup-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this class?</p>
                        <div className="popup-footer">
                            <button onClick={confirmDelete} className="confirm-button">
                                Yes
                            </button>
                            <button onClick={cancelDelete} className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
                        <h3>{popupMode === 'edit' ? 'Edit Class' : 'Delete Class'}</h3>
                        {popupMode === 'edit' ? (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Class Name"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                />
                                <div>
                                <hr></hr>
                                    <h4>Attributes</h4>
                                    {attributeList.map((attr, index) => (
                                        <div key={`attr-${index}`} className="inputs">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={attr.name}
                                                onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                                            />
                                            <select
                                                value={attr.type}
                                                onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                                            >
                                                <option value="">-- Select Type --</option>
                                                <option value="String">String</option>
                                                <option value="int">int</option>
                                                <option value="Boolean">Boolean</option>
                                                <option value="double">double</option>
                                                <option value="Date">Date</option>
                                            </select>
                                            <button onClick={() => deleteAttribute(index)} id="delete-button">
                                            <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    ))}
                                <div>
                                    <hr></hr>
                                    <h4>Methods</h4>
                                    {methodList.map((method, index) => (
                                        <div key={`method-${index}`} className="inputs">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={method.name}
                                                onChange={(e) => updateMethod(index, 'name', e.target.value)}
                                            />
                                            <select
                                                value={method.type}
                                                onChange={(e) => updateMethod(index, 'type', e.target.value)}
                                            >
                                                <option value="" disabled>Select Return Type</option>
                                                <option value="String">String</option>
                                                <option value="int">int</option>
                                                <option value="Boolean">boolean</option>
                                                <option value="double">double</option>
                                                <option value="void">void</option>
                                            </select>
                                            <button onClick={() => deleteMethod(index)} id="delete-button">
                                            <ion-icon name="trash-outline"></ion-icon>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                </div>
                                <button onClick={saveEdits} id='save'>Save</button>
                                <button onClick={handlePopupClose} id='close'>Close</button>
                            </div>
                        ):(
                            <h1>Hello</h1>
                        )}
                    </div>
                </div>
            )}
        </div>
        </>
        );
    };
        

export default UmlCanvas;
