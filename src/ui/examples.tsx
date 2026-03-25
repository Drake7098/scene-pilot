/**
 * FigmaUI Components Usage Examples
 * 
 * This file demonstrates how to use the new UI components
 * from the figmaUI design system integration.
 */

import React from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Section,
  Sidebar,
} from '@/ui/components';
import { Camera, Film, Layout, Settings } from 'lucide-react';

/**
 * Example 1: Basic Button Usage
 */
export function ButtonExample() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {/* Variants */}
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      
      {/* Sizes */}
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      
      {/* With icon */}
      <Button>
        <Camera size={16} />
        With Icon
      </Button>
    </div>
  );
}

/**
 * Example 2: Card Component
 */
export function CardExample() {
  return (
    <Card style={{ maxWidth: '400px', margin: '20px' }}>
      <CardHeader>
        <CardTitle>场景设置</CardTitle>
        <CardDescription>配置场景的基本参数</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input placeholder="场景名称" />
          <Input type="number" placeholder="持续时间 (秒)" />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" style={{ marginRight: '8px' }}>取消</Button>
        <Button>保存</Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Example 3: Section Component (like in Sidebar)
 */
export function SectionExample() {
  return (
    <div style={{ width: '260px' }}>
      <Section title="相机控制" icon={Camera} defaultOpen={true}>
        <Select
          label="相机类型"
          options={[
            { label: '透视', value: 'perspective' },
            { label: '正交', value: 'orthographic' },
            { label: '电影', value: 'cinematic' },
          ]}
        />
        <Select
          label="环境光"
          options={[
            { label: '工作室', value: 'studio' },
            { label: '自然光', value: 'natural' },
            { label: '夜景', value: 'night' },
          ]}
        />
      </Section>
      
      <Section title="对象图层" icon={Layout} defaultOpen={false}>
        <div style={{ fontSize: '11px', color: '#9ca3af', padding: '8px' }}>
          对象列表...
        </div>
      </Section>
      
      <Section title="属性" icon={Settings} defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Input placeholder="X: 0.0" />
          <Input placeholder="Y: 120.5" />
          <Input placeholder="宽度：300" />
          <Input placeholder="高度：400" />
        </div>
      </Section>
    </div>
  );
}

/**
 * Example 4: Complete Workspace Layout
 */
export function WorkspaceExample() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#1f2125',
    }}>
      {/* Left Sidebar */}
      <Sidebar>
        <Section title="场景列表" icon={Film}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                padding: '6px 8px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              场景 1
            </div>
            <div
              style={{
                padding: '6px 8px',
                color: '#e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              场景 2
            </div>
          </div>
        </Section>
      </Sidebar>
      
      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#1f2125',
      }}>
        {/* Top Bar */}
        <header style={{
          height: '48px',
          borderBottom: '1px solid #3a3f46',
          background: '#24262b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Untitled Project</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="outline">预览</Button>
            <Button size="sm">导出</Button>
          </div>
        </header>
        
        {/* Canvas */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}>
          <Card style={{ width: '400px' }}>
            <CardHeader>
              <CardTitle>快速设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Select
                  label="画面比例"
                  options={[
                    { label: '16:9', value: '16:9' },
                    { label: '9:16', value: '9:16' },
                    { label: '1:1', value: '1:1' },
                    { label: '21:9', value: '21:9' },
                  ]}
                />
                <Select
                  label="渲染质量"
                  options={[
                    { label: '快速', value: 'fast' },
                    { label: '标准', value: 'standard' },
                    { label: '高质量', value: 'high' },
                  ]}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button style={{ width: '100%' }}>应用设置</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      {/* Right Inspector */}
      <aside style={{
        width: '260px',
        borderLeft: '1px solid #3a3f46',
        background: '#24262b',
      }}>
        <Section title="属性" icon={Settings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Input placeholder="X: 0.0" />
            <Input placeholder="Y: 0.0" />
            <Input placeholder="缩放：1.0" />
            <Input placeholder="旋转：0°" />
          </div>
        </Section>
      </aside>
    </div>
  );
}

/**
 * Example 5: Form with Validation States
 */
export function FormExample() {
  return (
    <Card style={{ maxWidth: '500px' }}>
      <CardHeader>
        <CardTitle>创建新项目</CardTitle>
        <CardDescription>填写项目基本信息</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>
              项目名称
            </label>
            <Input placeholder="我的项目" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>
              项目类型
            </label>
            <Select
              options={[
                { label: '图片项目', value: 'image' },
                { label: '视频项目', value: 'video' },
              ]}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>
              分辨率
            </label>
            <Select
              options={[
                { label: '1920x1080 (HD)', value: '1920x1080' },
                { label: '3840x2160 (4K)', value: '3840x2160' },
                { label: '1080x1920 (竖屏)', value: '1080x1920' },
              ]}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter style={{ justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="ghost">取消</Button>
        <Button variant="outline">保存为草稿</Button>
        <Button>创建项目</Button>
      </CardFooter>
    </Card>
  );
}

export default {
  ButtonExample,
  CardExample,
  SectionExample,
  WorkspaceExample,
  FormExample,
};
