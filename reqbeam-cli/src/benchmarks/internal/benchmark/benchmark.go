package benchmark

// Context contains the context for a benchmark run
type Context struct {
	// Temporary directory for the benchmark
	TempDir string
}

// Result represents the result of a benchmark
type Result struct {
	// Name of the benchmark
	Name string `json:"name"`
	
	// Success indicates if the benchmark completed successfully
	Success bool `json:"success"`
	
	// ErrorMessage contains an error message if the benchmark failed
	ErrorMessage string `json:"errorMessage,omitempty"`
	
	// Raw measurements from the benchmark
	Measurements map[string]interface{} `json:"measurements"`
}

// Benchmark interface defines the contract for all benchmarks
type Benchmark interface {
	// Name returns the name of the benchmark
	Name() string
	
	// Description returns a description of what the benchmark measures
	Description() string
	
	// Available checks if the benchmark can run on the current system
	Available(ctx *Context) bool
	
	// Run executes the benchmark and returns the result
	Run(ctx *Context) *Result
}
