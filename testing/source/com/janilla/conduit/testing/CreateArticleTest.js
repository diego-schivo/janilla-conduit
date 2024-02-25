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
class CreateArticleTest {

	actions;

	run = async () => {
		await this.actions.login('sed@non', 'sed');
		await this.actions.openEditor();
		await this.actions.enter('Title', 'foo bar');
		await this.actions.enter('about', 'foo bar baz qux');
		await this.actions.enter('markdown', `# Heading level 1

This is the first line.  
And this is the second line.`);
		await this.actions.addTag('foo');
		await this.actions.addTag('bar');
		await this.actions.submit('Publish Article');
		await this.actions.openProfile('sed non');
		await this.actions.openArticle('foo bar');
		await new Promise(x => setTimeout(x, 200));
	}
}

export default CreateArticleTest;
