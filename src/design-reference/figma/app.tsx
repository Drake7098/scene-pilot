import React, { useState } from 'react';
import { 
    Settings, 
    User, 
    Bell, 
    ChevronDown, 
    ChevronRight,
    Layers, 
    Box, 
    Image as ImageIcon,
    Layout,
    Eye,
    EyeOff,
    Plus,
    MonitorPlay,
    Palette,
    Wand2,
    Camera,
    Lightbulb,
    LayoutGrid,
    Search,
    Move,
    Maximize,
    RotateCw,
    Blend,
    Video,
    Film,
    Play,
    Download,
    MessageSquare,
    MousePointer2,
    ImagePlus
} from 'lucide-react';

// Common Colors used for styling
const colors = {
    bg: '#1f2125',
    panel: '#24262b',
    border: '#3a3f46',
    hover: '#343942',
    buttonBase: '#2e333b',
    buttonBorder: '#4b515b',
    buttonHover: '#353a42',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    accent: '#f59e0b',
    accentHover: '#d97706',
};

// Reusable collapsible section component
const Section = ({ title, icon: Icon, children, defaultOpen = true, extra }: { title: string, icon?: React.ElementType, children: React.ReactNode, defaultOpen?: boolean, extra?: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <div className="border-b border-[#3a3f46] last:border-0">
            <div 
                className="flex items-center w-full px-3 py-2 hover:bg-[#343942] transition-colors group cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af] mr-1.5" />
                )}
                
                {Icon && <Icon className="w-3.5 h-3.5 mr-2 text-[#9ca3af]" />}
                <span className="flex-1 text-left text-xs font-semibold text-[#e5e7eb] uppercase tracking-wider">{title}</span>
                
                {extra && <div onClick={(e) => e.stopPropagation()}>{extra}</div>}
            </div>
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-3 pb-3 pt-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Custom Select Component
const SelectDropdown = ({ label, options, defaultValue }: { label?: string, options: string[], defaultValue?: string }) => {
    return (
        <div className="mb-3">
            {label && <label className="block text-[11px] font-medium text-[#9ca3af] mb-1">{label}</label>}
            <div className="relative">
                <select 
                    defaultValue={defaultValue}
                    className="w-full bg-[#1f2125] border border-[#3a3f46] text-[#e5e7eb] text-xs rounded py-1.5 pl-2.5 pr-6 appearance-none focus:outline-none focus:border-[#f59e0b] transition-all cursor-pointer hover:border-[#9ca3af]"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
    );
};

// Number Input Component
const NumberInput = ({ label, value, suffix = '' }: { label: string, value: string, suffix?: string }) => {
    return (
        <div>
            <label className="text-[10px] text-[#9ca3af] mb-1 block">{label}</label>
            <div className="bg-[#1f2125] border border-[#3a3f46] rounded px-2 py-1 flex items-center hover:border-[#9ca3af] transition-colors focus-within:border-[#f59e0b]">
                <input type="text" defaultValue={value} className="bg-transparent w-full text-xs text-[#e5e7eb] outline-none" />
                {suffix && <span className="text-[10px] text-[#9ca3af]">{suffix}</span>}
            </div>
        </div>
    );
};

// Checkbox Component
const Checkbox = ({ label, defaultChecked = false }: { label: string, defaultChecked?: boolean }) => {
    return (
        <label className="flex items-center space-x-2 cursor-pointer group py-1">
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${defaultChecked ? 'bg-[#f59e0b] border-[#f59e0b]' : 'border-[#3a3f46] bg-[#1f2125] group-hover:border-[#9ca3af]'}`}>
                {defaultChecked && <div className="w-1.5 h-1.5 bg-[#1f2125] rounded-sm"></div>}
            </div>
            <span className="text-xs text-[#e5e7eb]">{label}</span>
        </label>
    );
};

export default function App() {
    // State for top canvas tabs
    const [activeTab, setActiveTab] = useState('Main View');
    const canvasTabs = ['Main View', 'Scene 1', 'Scene 2'];

    return (
        <div className="flex flex-col h-screen bg-[#1f2125] text-[#e5e7eb] font-sans overflow-hidden selection:bg-[#f59e0b]/30">
            {/* --- Top Navigation Bar --- */}
            <header className="h-12 border-b border-[#3a3f46] bg-[#24262b] flex items-center justify-between px-4 shrink-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded bg-[#1f2125] flex items-center justify-center border border-[#3a3f46]">
                        <Layout className="w-3.5 h-3.5 text-[#e5e7eb]" />
                    </div>
                    <span className="font-semibold text-[#e5e7eb] text-sm">SceneMaker</span>
                    <span className="text-[#9ca3af] text-xs">/ Untitled Project</span>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button className="flex items-center px-2 py-1 text-xs text-[#9ca3af] hover:text-[#e5e7eb] transition-colors rounded hover:bg-[#343942]">
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </button>
                    <button className="flex items-center px-2 py-1 text-xs text-[#9ca3af] hover:text-[#e5e7eb] transition-colors rounded hover:bg-[#343942]">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                    </button>
                    <div className="h-4 w-px bg-[#3a3f46] mx-1"></div>
                    <button className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-[#e5e7eb] rounded hover:bg-[#343942] transition-colors">
                        <User className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* --- Main Workspace --- */}
            <main className="flex flex-1 overflow-hidden">
                
                {/* Left Sidebar */}
                <aside className="w-[260px] border-r border-[#3a3f46] bg-[#24262b] flex flex-col shrink-0 z-10">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3f46] scrollbar-track-transparent">
                        
                        {/* Templates Library */}
                        <Section title="Template Library" icon={LayoutGrid} defaultOpen={false}>
                            <div className="mb-2 flex items-center bg-[#1f2125] border border-[#3a3f46] rounded px-2 py-1.5">
                                <Search className="w-3.5 h-3.5 text-[#9ca3af] mr-2" />
                                <input type="text" placeholder="Search templates..." className="bg-transparent border-none text-xs text-[#e5e7eb] focus:outline-none w-full placeholder:text-[#9ca3af]" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[1, 2, 3, 4].map((tpl) => (
                                    <div key={tpl} className="aspect-video bg-[#1f2125] rounded border border-[#3a3f46] hover:border-[#f59e0b] cursor-pointer overflow-hidden flex items-center justify-center">
                                        <span className="text-[10px] text-[#9ca3af]">Preset {tpl}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Scene List */}
                        <Section 
                            title="Scene List" 
                            icon={Film}
                            extra={<button className="text-[#9ca3af] hover:text-[#e5e7eb]"><Plus className="w-3.5 h-3.5" /></button>}
                        >
                            <div className="space-y-1">
                                {[
                                    { id: 1, name: 'Scene 1', active: activeTab === 'Scene 1' },
                                    { id: 2, name: 'Scene 2', active: activeTab === 'Scene 2' },
                                ].map((scene) => (
                                    <div 
                                        key={scene.id} 
                                        onClick={() => setActiveTab(scene.name)}
                                        className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${scene.active ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'text-[#e5e7eb] hover:bg-[#343942]'}`}
                                    >
                                        <Video className="w-3.5 h-3.5 opacity-70" />
                                        <span className="flex-1 truncate">{scene.name}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {/* Camera & Lighting */}
                        <Section title="Camera & Lighting" icon={Camera}>
                            <SelectDropdown label="Camera Type" options={['Perspective', 'Orthographic', 'Cinematic']} defaultValue="Perspective" />
                            <SelectDropdown label="Environment Light" options={['Studio Setup', 'Natural Day', 'Night Scene', 'Custom HDRI']} defaultValue="Studio Setup" />
                        </Section>

                        {/* Object Layers */}
                        <Section 
                            title="Object Layers" 
                            icon={Layers}
                            extra={<button className="text-[#9ca3af] hover:text-[#e5e7eb]"><Plus className="w-3.5 h-3.5" /></button>}
                        >
                            <div className="space-y-0.5">
                                {[
                                    { name: 'Main Character Mesh', icon: User, visible: true, locked: false, active: true },
                                    { name: 'Building Geometry', icon: Box, visible: true, locked: true },
                                    { name: 'Ground Plane', icon: Layout, visible: true, locked: true },
                                    { name: 'Directional Light', icon: Lightbulb, visible: true, locked: false },
                                ].map((obj, i) => (
                                    <div key={i} className={`flex items-center space-x-2 px-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${obj.active ? 'bg-[#343942] text-[#e5e7eb]' : 'text-[#9ca3af] hover:bg-[#343942] hover:text-[#e5e7eb]'}`}>
                                        <button className="p-0.5 text-[#9ca3af] hover:text-[#e5e7eb]">
                                            {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-50" />}
                                        </button>
                                        <obj.icon className="w-3.5 h-3.5 opacity-80" />
                                        <span className="flex-1 truncate">{obj.name}</span>
                                        {obj.locked && <div className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] opacity-50"></div>}
                                    </div>
                                ))}
                            </div>
                        </Section>

                    </div>
                </aside>

                {/* Center Canvas Area */}
                <section className="flex-1 flex flex-col relative bg-[#1f2125] min-w-0">
                    
                    {/* Top Browser-style Tab Bar */}
                    <div className="flex items-end px-2 pt-2 bg-[#24262b] border-b border-[#3a3f46] space-x-1 shrink-0 h-[38px] z-20 shadow-sm">
                        {canvasTabs.map(tab => (
                            <div
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-t-md border-t border-x cursor-pointer transition-colors relative flex items-center group ${
                                    activeTab === tab
                                        ? 'bg-[#1f2125] border-[#3a3f46] text-[#f59e0b] z-10'
                                        : 'bg-[#1a1c1f] border-transparent text-[#9ca3af] hover:bg-[#2d3036] hover:text-[#e5e7eb]'
                                }`}
                            >
                                {tab === 'Main View' ? <Layout className="w-3.5 h-3.5 mr-1.5 opacity-80" /> : <ImageIcon className="w-3.5 h-3.5 mr-1.5 opacity-80" />}
                                {tab}
                                {/* Seamless connector for active tab */}
                                {activeTab === tab && (
                                    <div className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-[#1f2125]"></div>
                                )}
                            </div>
                        ))}
                        <div className="px-2 py-1.5 mb-[1px] text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer hover:bg-[#2d3036] rounded transition-colors flex items-center">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    {/* Canvas Viewport Area */}
                    <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                        
                        {/* 3D Viewport Grid Background (Always visible as base) */}
                        <div 
                            className="absolute inset-0 z-0"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px',
                                backgroundPosition: 'center center'
                            }}
                        >
                            {/* Axis Lines for Main View Editor */}
                            {activeTab === 'Main View' && (
                                <>
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-red-500/20"></div>
                                    <div className="absolute top-0 left-1/2 w-px h-full bg-blue-500/20"></div>
                                </>
                            )}
                        </div>

                        {/* Content based on Active Tab */}
                        {activeTab === 'Main View' ? (
                            <>
                                {/* Top Toolbar overlay (Editor tools) */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-[#24262b] border border-[#3a3f46] rounded shadow-sm overflow-hidden">
                                    {[
                                        { icon: MousePointer2, active: true },
                                        { icon: Move, active: false },
                                        { icon: RotateCw, active: false },
                                        { icon: Maximize, active: false }
                                    ].map((tool, i) => (
                                        <button key={i} className={`p-1.5 w-8 h-8 flex items-center justify-center transition-colors ${tool.active ? 'bg-[#343942] text-[#f59e0b]' : 'text-[#9ca3af] hover:bg-[#343942] hover:text-[#e5e7eb]'}`}>
                                            <tool.icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>

                                {/* Editor Object Wireframe */}
                                <div className="relative w-[300px] h-[400px] border border-[#f59e0b] bg-[#f59e0b]/5 flex items-center justify-center group cursor-move z-10">
                                    {/* Transform Handles */}
                                    <div className="absolute top-0 left-0 w-2 h-2 bg-[#1f2125] border border-[#f59e0b] -translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-[#1f2125] border border-[#f59e0b] translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#1f2125] border border-[#f59e0b] -translate-x-1/2 translate-y-1/2"></div>
                                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#1f2125] border border-[#f59e0b] translate-x-1/2 translate-y-1/2"></div>
                                    
                                    {/* Center Gizmo */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative w-12 h-12">
                                            <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-red-500/80 -translate-y-1/2 rounded-full"></div>
                                            <div className="absolute top-1/2 left-1/2 w-0.5 h-full bg-blue-500/80 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#f59e0b] rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-[#1f2125]"></div>
                                        </div>
                                    </div>

                                    <span className="absolute -top-6 left-0 text-[10px] text-[#f59e0b] bg-[#24262b] px-1.5 py-0.5 rounded-sm border border-[#3a3f46]">Main Character Mesh</span>
                                </div>
                            </>
                        ) : (
                            /* Generated Scene Image View */
                            <div className="relative w-[80%] max-w-[800px] aspect-video bg-[#111] border border-[#3a3f46] flex flex-col items-center justify-center shadow-2xl overflow-hidden z-10 rounded-sm">
                                {/* Simulated image content styling */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0c]"></div>
                                
                                <ImagePlus className="w-10 h-10 text-[#3a3f46] mb-3 relative z-10" />
                                <span className="text-[#e5e7eb] text-sm font-medium relative z-10">{activeTab} Render Output</span>
                                <span className="text-[#9ca3af] text-xs mt-1 relative z-10">1920x1080 • Unreal Engine 5 Style</span>
                                
                                <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                                    <span className="bg-[#f59e0b] text-[#1f2125] text-[10px] px-2 py-0.5 rounded-sm font-bold tracking-wider">GENERATED</span>
                                </div>
                                <div className="absolute bottom-4 left-4 z-10 bg-[#1f2125]/80 backdrop-blur text-[10px] text-[#9ca3af] border border-[#3a3f46]/50 px-2 py-1 rounded">
                                    Prompt: Highly detailed cyberpunk street scene...
                                </div>
                            </div>
                        )}

                        {/* Viewport Info Overlay (Always bottom left inside viewport) */}
                        <div className="absolute bottom-4 left-4 text-[10px] text-[#9ca3af] font-mono bg-[#24262b]/80 backdrop-blur px-2 py-1 rounded border border-[#3a3f46] z-20">
                            {activeTab === 'Main View' ? 'Perspective | Shaded | X: 0.0 Y: 0.0 Z: 0.0' : `${activeTab} | Image Viewer | 100%`}
                        </div>
                    </div>

                    {/* Bottom Panel: Prompt / Export / Review */}
                    <div className="h-[160px] bg-[#24262b] border-t border-[#3a3f46] p-4 shrink-0 flex flex-col z-10 relative">
                        <div className="flex items-center space-x-4 border-b border-[#3a3f46] pb-2 mb-3">
                            <button className="text-xs font-medium text-[#e5e7eb] border-b-2 border-[#f59e0b] pb-2 -mb-2.5">Prompt Editor</button>
                            <button className="text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] pb-2 -mb-2.5 transition-colors">Export Settings</button>
                            <button className="text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] pb-2 -mb-2.5 transition-colors flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> Reviews</button>
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                            <textarea 
                                className="flex-1 bg-[#1f2125] border border-[#3a3f46] rounded p-2 text-xs text-[#e5e7eb] font-mono resize-none focus:outline-none focus:border-[#f59e0b] placeholder:text-[#3a3f46] transition-colors"
                                placeholder="Describe the scene generation parameters or notes here..."
                                defaultValue="Generate a highly detailed cyberpunk street scene.
Main subject: Person standing in neon-lit alleyway.
Lighting: High contrast, cinematic, dramatic shadows.
Camera: 35mm lens, slight low angle."
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-[#9ca3af]">Press Shift + Enter to render</span>
                                <button className="bg-[#f59e0b] hover:bg-[#d97706] text-[#1f2125] font-semibold px-4 py-1.5 rounded text-xs transition-colors shadow-sm">
                                    Process Scene
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Inspector */}
                <aside className="w-[260px] border-l border-[#3a3f46] bg-[#24262b] flex flex-col shrink-0 z-10">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3f46] scrollbar-track-transparent">
                        
                        {/* Scene Background */}
                        <Section title="Scene Background" icon={ImageIcon} defaultOpen={false}>
                            <SelectDropdown label="Background Type" options={['Solid Color', 'Gradient', 'Image Map', 'Transparent']} defaultValue="Solid Color" />
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded border border-[#3a3f46] bg-[#1f2125]"></div>
                                <span className="text-xs text-[#9ca3af] font-mono">#1F2125</span>
                            </div>
                        </Section>

                        {/* Properties */}
                        <Section title="Properties" icon={Settings}>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <NumberInput label="Position X" value="0.0" />
                                <NumberInput label="Position Y" value="120.5" />
                                <NumberInput label="Width" value="300" />
                                <NumberInput label="Height" value="400" />
                                <NumberInput label="Scale X" value="1.0" />
                                <NumberInput label="Scale Y" value="1.0" />
                            </div>
                            <div className="border-t border-[#3a3f46] pt-3 mt-3">
                                <NumberInput label="Rotation (deg)" value="0" />
                            </div>
                        </Section>

                        {/* Composition */}
                        <Section title="Composition" icon={Layout}>
                            <SelectDropdown label="Grid Helper" options={['None', 'Rule of Thirds', 'Golden Ratio', 'Crosshair']} defaultValue="Rule of Thirds" />
                            <div className="space-y-1 mt-2">
                                <Checkbox label="Snap to Grid" defaultChecked={true} />
                                <Checkbox label="Show Safe Margins" />
                            </div>
                        </Section>

                        {/* Effects */}
                        <Section title="Effects" icon={Blend}>
                            <SelectDropdown label="Post-Processing" options={['None', 'Bloom', 'Color Grading', 'Depth of Field']} defaultValue="Bloom" />
                            
                            <div className="mt-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] text-[#9ca3af]">Intensity</label>
                                    <span className="text-[10px] text-[#e5e7eb] font-mono">0.8</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    defaultValue="80"
                                    className="w-full h-1 bg-[#1f2125] rounded appearance-none cursor-pointer accent-[#f59e0b] focus:outline-none focus:ring-1 focus:ring-[#f59e0b]" 
                                />
                            </div>
                        </Section>

                    </div>
                </aside>

            </main>
        </div>
    );
}
