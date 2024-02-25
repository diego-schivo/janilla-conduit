/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import Actions from './Actions.js';
import tests from './tests.js';

class TestBench {

	selector;

	launcher;

	runner;

	render = async engine => {
		if (engine.isRendering(this))
			return engine.render(this, 'TestBench');

		if (engine.isRendering(this, 'launcher')) {
			this.launcher = new Launcher();
			this.launcher.selector = () => this.selector().firstElementChild;
			return this.launcher;
		}

		if (engine.isRendering(this, 'runner')) {
			this.runner = new Runner();
			this.runner.selector = () => this.selector().lastElementChild;
			return this.runner;
		}
	}

	listen = () => {
		this.selector().addEventListener('testsuitelaunch', this.handleTestSuiteLaunch);
		this.selector().addEventListener('testcomplete', this.handleTestComplete);
		this.launcher.listen();
		this.runner.listen();
	}

	handleTestSuiteLaunch = e => {
		this.launcher.selector().querySelectorAll('[data-key]').forEach(e => e.className = '');
		this.runner.keys = e.detail.tests;
		this.runner.refresh();
	}

	handleTestComplete = e => {
		const f = this.launcher.selector().querySelector(`[data-key="${e.detail.key}"]`);
		if (e.detail.error) {
			f.className = 'failed';
			f.setAttribute('title', e.detail.error);
		} else {
			f.className = 'succeeded';
			f.removeAttribute('title');
		}
	}
}

class Launcher {

	selector;

	get items() {
		return Object.keys(tests);
	}

	render = async engine => {
		if (engine.isRendering(this))
			return engine.render(this, 'TestBench-Launcher');

		if (engine.isRendering(this, 'items', true))
			return await engine.render(engine.target, 'TestBench-Launcher-item');
	}

	listen = () => {
		this.selector().querySelector('input').addEventListener('change', this.handleInputChange);
		this.selector().querySelector('form').addEventListener('submit', this.handleFormSubmit);
	}

	handleInputChange = e => {
		const c = e.currentTarget.checked;
		this.selector().querySelectorAll('[data-key] input').forEach(f => f.checked = c);
	}

	handleFormSubmit = async e => {
		e.preventDefault();
		const f = e.currentTarget;
		this.selector().dispatchEvent(new CustomEvent('testsuitelaunch', {
			bubbles: true,
			detail: { tests: new FormData(f).getAll('test') }
		}));
	}
}

class Runner {

	selector;

	engine;

	keys;

	render = async engine => {
		if (engine.isRendering(this)) {
			this.engine = engine.clone();
			return engine.render(this, 'TestBench-Runner');
		}

		if (engine.isRendering(this, 'iframe')) {
			if (!this.keys?.length)
				return null;
			await fetch('/test/start', { method: 'POST' });
			localStorage.removeItem('jwtToken');
			return engine.render(this, 'TestBench-Runner-iframe');
		}
	}

	listen = () => {
		this.selector().querySelector('iframe')?.addEventListener('load', this.handleIframeLoad);
	}

	refresh = async () => {
		this.selector().outerHTML = await this.render(this.engine);
		this.listen();
	}

	handleIframeLoad = async e => {
		const i = e.currentTarget;
		const k = this.keys.shift();
		const t = tests[k]();
		t.actions = new Actions();
		t.actions.document = i.contentDocument;
		t.run().then(() => this.selector().dispatchEvent(new CustomEvent('testcomplete', {
			bubbles: true,
			detail: { key: k }
		}))).catch(f => this.selector().dispatchEvent(new CustomEvent('testcomplete', {
			bubbles: true,
			detail: {
				key: k,
				error: f
			}
		}))).finally(async () => {
			await fetch('/test/stop', { method: 'POST' });
			await this.refresh();
		});
	}
}

export default TestBench;
