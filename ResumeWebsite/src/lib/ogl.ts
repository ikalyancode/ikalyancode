export type UniformValue = number | number[] | Float32Array;

export class Renderer {
  gl: WebGLRenderingContext;
  dpr: number;
  canvas: HTMLCanvasElement;

  constructor(options: { dpr?: number; alpha?: boolean; antialias?: boolean } = {}) {
    const { dpr = 1, alpha = true, antialias = true } = options;
    this.dpr = dpr;
    this.canvas = document.createElement('canvas');
    const gl =
      (this.canvas.getContext('webgl', { alpha, antialias }) as WebGLRenderingContext | null) ||
      (this.canvas.getContext('experimental-webgl', { alpha, antialias }) as WebGLRenderingContext | null);

    if (!gl) {
      throw new Error('WebGL is not supported in this browser.');
    }

    this.gl = gl;
    this.gl.clearColor(0, 0, 0, 0);
  }

  setSize(width: number, height: number) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render({ scene }: { scene: Mesh }) {
    scene.draw();
  }
}

export class Triangle {
  gl: WebGLRenderingContext;
  buffer: WebGLBuffer | null;
  vertexCount: number;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.vertexCount = 3;
    const buffer = gl.createBuffer();
    this.buffer = buffer;
    if (buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    }
  }
}

interface UniformDefinition {
  value: UniformValue;
}

interface ProgramOptions {
  vertex: string;
  fragment: string;
  uniforms?: Record<string, UniformDefinition>;
}

export class Program {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, UniformDefinition>;
  uniformLocations: Record<string, WebGLUniformLocation | null>;

  constructor(gl: WebGLRenderingContext, options: ProgramOptions) {
    this.gl = gl;
    const vertShader = this.createShader(gl.VERTEX_SHADER, options.vertex);
    const fragShader = this.createShader(gl.FRAGMENT_SHADER, options.fragment);

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create WebGL program.');
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(info || 'Could not link WebGL program.');
    }

    this.program = program;
    this.uniforms = options.uniforms || {};
    this.uniformLocations = {};

    Object.keys(this.uniforms).forEach((name) => {
      this.uniformLocations[name] = gl.getUniformLocation(program, name);
    });
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create WebGL shader.');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(info || 'Could not compile shader.');
    }

    return shader;
  }

  use() {
    this.gl.useProgram(this.program);
    this.applyUniforms();
  }

  private applyUniforms() {
    Object.entries(this.uniforms).forEach(([name, uniform]) => {
      const location = this.uniformLocations[name];
      if (!location) return;

      const value = uniform.value as UniformValue;
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          this.gl.uniform1i(location, value);
        } else {
          this.gl.uniform1f(location, value);
        }
        return;
      }

      if (value instanceof Float32Array) {
        this.applyArrayUniform(location, value);
        return;
      }

      if (Array.isArray(value)) {
        this.applyArrayUniform(location, new Float32Array(value));
      }
    });
  }

  private applyArrayUniform(location: WebGLUniformLocation, value: Float32Array) {
    const { gl } = this;
    switch (value.length) {
      case 2:
        gl.uniform2fv(location, value);
        break;
      case 3:
        gl.uniform3fv(location, value);
        break;
      case 4:
        gl.uniform4fv(location, value);
        break;
      case 9:
        gl.uniformMatrix3fv(location, false, value);
        break;
      default:
        gl.uniform1fv(location, value);
        break;
    }
  }
}

interface MeshOptions {
  geometry: Triangle;
  program: Program;
}

export class Mesh {
  gl: WebGLRenderingContext;
  geometry: Triangle;
  program: Program;
  positionLocation: number;

  constructor(gl: WebGLRenderingContext, options: MeshOptions) {
    this.gl = gl;
    this.geometry = options.geometry;
    this.program = options.program;
    this.positionLocation = gl.getAttribLocation(this.program.program, 'position');
  }

  draw() {
    const { gl } = this;
    this.program.use();

    if (this.geometry.buffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometry.buffer);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.geometry.vertexCount);
  }
}
