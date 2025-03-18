"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator" 
import { Wave } from "@/components/ui/wave"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * WaveTestPage 컴포넌트
 * Wave 컴포넌트를 테스트하기 위한 페이지
 */
export default function WaveTestPage() {
  const [color, setColor] = useState("red")
  const [opacity, setOpacity] = useState(5)
  const [height, setHeight] = useState(8)
  const [animationDuration, setAnimationDuration] = useState(25)
  const [fadeIn, setFadeIn] = useState(true)
  const [isInverted, setIsInverted] = useState(false)

  // 미리 정의된 색상 목록
  const colors = [
    { name: "Red", value: "red" },
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Yellow", value: "yellow" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
    { name: "Indigo", value: "indigo" },
    { name: "Gray", value: "gray" },
    { name: "White", value: "white" },
    { name: "Black", value: "black" },
    { name: "Custom (RGB)", value: "239,68,68" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-12">
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <Button variant="ghost" size="icon" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Wave Component Test</h1>
          <p className="text-muted-foreground">
            This page demonstrates the Wave component with various colors and settings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Wave Settings</CardTitle>
                <CardDescription>Adjust the Wave component parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Opacity ({opacity}%)</Label>
                  </div>
                  <Slider 
                    value={[opacity]} 
                    onValueChange={(values) => setOpacity(values[0])} 
                    min={1}
                    max={30}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Height ({height}px)</Label>
                  </div>
                  <Slider 
                    value={[height]} 
                    onValueChange={(values) => setHeight(values[0])} 
                    min={4}
                    max={40}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Animation Duration ({animationDuration}s)</Label>
                  </div>
                  <Slider 
                    value={[animationDuration]} 
                    onValueChange={(values) => setAnimationDuration(values[0])} 
                    min={5}
                    max={60}
                    step={1}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="fade-in">Fade In</Label>
                  <Switch 
                    id="fade-in" 
                    checked={fadeIn} 
                    onCheckedChange={setFadeIn} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="inverted">Inverted</Label>
                  <Switch 
                    id="inverted" 
                    checked={isInverted} 
                    onCheckedChange={setIsInverted} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-8">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Wave with your selected settings</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[400px] border rounded-md bg-muted/30 relative overflow-hidden">
                  {/* Content area */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-lg font-medium text-muted-foreground">Content Area</p>
                  </div>
                  
                  {/* Wave display */}
                  <div className={`${isInverted ? "rotate-180 bottom-auto top-0" : "bottom-0"} absolute left-0 w-full z-10`}>
                    <Wave 
                      height={height} 
                      color={color} 
                      opacity={opacity} 
                      animationDuration={animationDuration}
                      fadeIn={fadeIn}
                      absolute={false}
                    />
                  </div>
                </div>
                
                <div className="mt-8 border p-4 rounded-md bg-muted/10">
                  <h3 className="text-sm font-medium mb-2">Component Code:</h3>
                  <pre className="text-xs p-2 bg-black/90 text-gray-200 rounded-md overflow-x-auto">
                    {`<Wave
  height={${height}}
  color="${color}"
  opacity={${opacity}}
  animationDuration={${animationDuration}}
  fadeIn={${fadeIn.toString()}}
  ${isInverted ? '// For inverted use with styling:\n  // className="rotate-180"' : ''}
/>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Separator className="my-12" />
      
      <div className="container max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Sample Implementations</h2>
        
        <div className="space-y-16">
          {/* Red Wave (Default) */}
          <div>
            <h3 className="text-lg font-medium mb-2">Default Red Wave</h3>
            <div className="h-[200px] border rounded-md bg-muted/30 relative overflow-hidden">
              <Wave />
            </div>
          </div>
          
          {/* Blue Wave */}
          <div>
            <h3 className="text-lg font-medium mb-2">Blue Wave</h3>
            <div className="h-[200px] border rounded-md bg-muted/30 relative overflow-hidden">
              <Wave color="blue" opacity={8} />
            </div>
          </div>
          
          {/* Green Wave (Inverted) */}
          <div>
            <h3 className="text-lg font-medium mb-2">Inverted Green Wave</h3>
            <div className="h-[200px] border rounded-md bg-muted/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full rotate-180">
                <Wave color="green" opacity={10} absolute={false} />
              </div>
            </div>
          </div>
          
          {/* Purple Wave (Taller) */}
          <div>
            <h3 className="text-lg font-medium mb-2">Taller Purple Wave</h3>
            <div className="h-[200px] border rounded-md bg-muted/30 relative overflow-hidden">
              <Wave color="purple" height={20} opacity={7} />
            </div>
          </div>
          
          {/* Fast Yellow Wave */}
          <div>
            <h3 className="text-lg font-medium mb-2">Fast Yellow Wave</h3>
            <div className="h-[200px] border rounded-md bg-muted/30 relative overflow-hidden">
              <Wave color="yellow" opacity={10} animationDuration={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 