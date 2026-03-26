"use client"
import React, { useEffect, useRef } from "react"

export default function FoldParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const mouseRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
    const particlesRef = useRef<any[]>([])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initParticles()
        }

        const initParticles = () => {
            const particleCount = 80
            particlesRef.current = []
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    baseX: Math.random() * canvas.width,
                    baseY: Math.random() * canvas.height,
                    vx: 0,
                    vy: 0,
                    radius: Math.random() * 2 + 1,
                })
            }
        }

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        initParticles()

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("resize", handleResize)

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const particles = particlesRef.current
            const mouse = mouseRef.current
            const particleColor = "#FFFFFF"

            particles.forEach((particle, i) => {
                const dx = mouse.x - particle.x
                const dy = mouse.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                const maxDistance = 150

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance
                    particle.vx += (dx / distance) * force * 0.5
                    particle.vy += (dy / distance) * force * 0.5
                } else {
                    const returnDx = particle.baseX - particle.x
                    const returnDy = particle.baseY - particle.y
                    particle.vx += returnDx * 0.01
                    particle.vy += returnDy * 0.01
                }

                particle.vx *= 0.85
                particle.vy *= 0.85
                particle.x += particle.vx
                particle.y += particle.vy

                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
                ctx.fillStyle = particleColor
                ctx.fill()

                particles.forEach((particle2, j) => {
                    if (i === j) return
                    const dx2 = particle.x - particle2.x
                    const dy2 = particle.y - particle2.y
                    const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2)

                    if (dist < 100) {
                        ctx.beginPath()
                        ctx.moveTo(particle.x, particle.y)
                        ctx.lineTo(particle2.x, particle2.y)
                        const opacity = (100 - dist) / 100
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                })
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    )
}
