import React from 'react'
import type { EnvironmentInfo, RuntimeFlags } from './types'

declare const __REACT_PROFILING__: boolean
declare const __APP_VERSION__: string
declare const __GIT_COMMIT__: string
declare const __LIBRARY_VERSIONS__: Record<string, string>

const unknown = 'unknown'

const getBrowser = (userAgent: string) => {
	const rules: Array<[string, RegExp]> = [
		['Edge', /Edg\/([\d.]+)/],
		['Chrome', /Chrome\/([\d.]+)/],
		['Firefox', /Firefox\/([\d.]+)/],
		['Safari', /Version\/([\d.]+).*Safari/],
	]
	const match = rules
		.map(([name, pattern]) => {
			const result = userAgent.match(pattern)
			return result ? { name, version: result[1] } : null
		})
		.find(Boolean)

	return {
		name: match?.name ?? unknown,
		version: match?.version ?? unknown,
	}
}

const getOS = (userAgent: string, platform: string) => {
	if (/Windows/i.test(userAgent)) return 'Windows'
	if (/Mac OS X|Macintosh/i.test(userAgent) || /Mac/i.test(platform)) return 'macOS'
	if (/Linux/i.test(userAgent)) return 'Linux'
	if (/Android/i.test(userAgent)) return 'Android'
	if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
	return unknown
}

const getWebGLInfo = () => {
	try {
		const canvas = document.createElement('canvas')
		const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
		if (!gl) return { vendor: unknown, renderer: unknown }
		const context = gl as WebGLRenderingContext
		const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
		return {
			vendor: debugInfo
				? String(context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
				: String(context.getParameter(context.VENDOR) ?? unknown),
			renderer: debugInfo
				? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
				: String(context.getParameter(context.RENDERER) ?? unknown),
		}
	} catch {
		return { vendor: unknown, renderer: unknown }
	}
}

export const getRuntimeFlags = (): RuntimeFlags => ({
	profilingEnabled:
		typeof __REACT_PROFILING__ === 'boolean' ? __REACT_PROFILING__ : false,
	buildMode: import.meta.env.MODE,
	gitCommitHash:
		typeof __GIT_COMMIT__ === 'string' && __GIT_COMMIT__
			? __GIT_COMMIT__
			: unknown,
	appVersion:
		typeof __APP_VERSION__ === 'string' && __APP_VERSION__
			? __APP_VERSION__
			: unknown,
	libraryVersions:
		typeof __LIBRARY_VERSIONS__ === 'object' ? __LIBRARY_VERSIONS__ : {},
})

export const captureEnvironmentInfo = (): EnvironmentInfo => {
	const userAgent = navigator.userAgent || unknown
	const browser = getBrowser(userAgent)
	const webgl = getWebGLInfo()
	const runtime = getRuntimeFlags()

	return {
		browserName: browser.name,
		browserVersion: browser.version,
		userAgent,
		os: getOS(userAgent, navigator.platform),
		platform: navigator.platform || unknown,
		timestamp: new Date().toISOString(),
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || unknown,
		language: navigator.language || unknown,
		screenResolution: `${screen.width}x${screen.height}`,
		viewportSize: `${window.innerWidth}x${window.innerHeight}`,
		devicePixelRatio: window.devicePixelRatio || 1,
		hardwareConcurrency: navigator.hardwareConcurrency ?? unknown,
		deviceMemory: (navigator as Navigator & { deviceMemory?: number })
			.deviceMemory ?? unknown,
		webglVendor: webgl.vendor,
		webglRenderer: webgl.renderer,
		reactVersion: React.version,
		libraryVersions: runtime.libraryVersions,
		buildMode: runtime.buildMode,
		profilingEnabled: runtime.profilingEnabled,
		gitCommitHash: runtime.gitCommitHash,
		appVersion: runtime.appVersion,
	}
}
