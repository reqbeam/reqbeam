package benchmark

import (
	"os"
)

// Runner executes benchmarks
type Runner struct {
	// Temporary directory root for all benchmarks
	TempDirRoot string
}

// NewRunner creates a new benchmark runner
func NewRunner(tempDirRoot string) *Runner {
	return &Runner{
		TempDirRoot: tempDirRoot,
	}
}

// RunBenchmarks executes a list of benchmarks and returns their results
func (r *Runner) RunBenchmarks(benchmarks []Benchmark) []*Result {
	var results []*Result

	// Create a temporary directory for this benchmark run
	tempDir, err := os.MkdirTemp(r.TempDirRoot, "devspeed-")
	if err != nil {
		// If we can't create a temp directory, return an error result
		results = append(results, &Result{
			Name:        "temp-dir-creation",
			Success:     false,
			ErrorMessage: "failed to create temporary directory: " + err.Error(),
			Measurements: make(map[string]interface{}),
		})
		return results
	}
	defer os.RemoveAll(tempDir) // Clean up after all benchmarks

	// Create a context for the benchmarks
	ctx := &Context{
		TempDir: tempDir,
	}

	// Run each benchmark
	for _, b := range benchmarks {
		// Check if the benchmark is available
		if !b.Available(ctx) {
			continue
		}
		
		// Run the benchmark
		result := b.Run(ctx)
		results = append(results, result)
	}

	return results
}