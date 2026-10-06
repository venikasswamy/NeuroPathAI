/*
# NeuroPath AI — Seed Data: Skills, Prerequisites, Resources, Lessons, Assessment Questions

## Overview
Seeds the global catalog tables with educational content for a Machine Learning Engineer learning path.

## Data Inserted
1. **skills** — 22 skills across programming, math, ML, and data categories
2. **skill_prerequisites** — Dependency graph (e.g., ML requires Python + Statistics)
3. **lessons** — Lesson entries for each skill with objectives and content
4. **assessment_questions** — Question bank with MC, T/F questions across skills
5. **resources** — Internal resources (articles, practice exercises, documentation)

## Notes
- Uses ON CONFLICT DO NOTHING for idempotency (re-runnable)
- All resources are internal (is_internal=true) — no external URLs fabricated
- Assessment questions include explanations for learning
*/

-- ============================================================================
-- SKILLS
-- ============================================================================
INSERT INTO skills (slug, name, category, description, difficulty, target_proficiency) VALUES
('python', 'Python Programming', 'Programming', 'Core programming language for ML and data science', 'beginner', 85),
('statistics', 'Statistics', 'Mathematics', 'Descriptive and inferential statistics for data analysis', 'beginner', 75),
('machine-learning', 'Machine Learning', 'ML Core', 'Supervised and unsupervised learning algorithms', 'intermediate', 85),
('sql', 'SQL', 'Data', 'Querying and managing relational databases', 'beginner', 70),
('data-structures', 'Data Structures', 'Programming', 'Arrays, lists, trees, graphs, hash maps', 'beginner', 75),
('calculus', 'Calculus', 'Mathematics', 'Derivatives, integrals, gradients for ML optimization', 'intermediate', 70),
('linear-algebra', 'Linear Algebra', 'Mathematics', 'Vectors, matrices, eigenvalues for ML', 'intermediate', 75),
('probability', 'Probability', 'Mathematics', 'Probability theory and distributions', 'intermediate', 75),
('pandas', 'Pandas', 'Programming', 'Data manipulation and analysis library', 'beginner', 80),
('numpy', 'NumPy', 'Programming', 'Numerical computing with arrays', 'beginner', 80),
('deep-learning', 'Deep Learning', 'ML Core', 'Neural networks, backpropagation, deep architectures', 'advanced', 80),
('neural-networks', 'Neural Networks', 'ML Core', 'Architecture and training of neural networks', 'advanced', 80),
('data-preprocessing', 'Data Preprocessing', 'Data', 'Cleaning, transforming, and encoding data', 'beginner', 80),
('model-evaluation', 'Model Evaluation', 'ML Core', 'Metrics, cross-validation, overfitting, bias-variance', 'intermediate', 80),
('feature-engineering', 'Feature Engineering', 'ML Core', 'Creating and selecting features for models', 'intermediate', 80),
('supervised-learning', 'Supervised Learning', 'ML Core', 'Regression and classification with labeled data', 'intermediate', 85),
('unsupervised-learning', 'Unsupervised Learning', 'ML Core', 'Clustering and dimensionality reduction', 'intermediate', 80),
('git', 'Git & Version Control', 'Programming', 'Version control, branching, collaboration', 'beginner', 65),
('data-visualization', 'Data Visualization', 'Data', 'Charts, plots, and visual communication of data', 'beginner', 75),
('regression', 'Regression', 'ML Core', 'Linear and logistic regression techniques', 'intermediate', 85),
('classification', 'Classification', 'ML Core', 'Decision trees, SVM, KNN, ensemble methods', 'intermediate', 85),
('clustering', 'Clustering', 'ML Core', 'K-means, hierarchical clustering, DBSCAN', 'intermediate', 80)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SKILL PREREQUISITES
-- ============================================================================
INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'machine-learning' AND s2.slug IN ('python', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'deep-learning' AND s2.slug IN ('machine-learning', 'neural-networks', 'linear-algebra')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'neural-networks' AND s2.slug IN ('linear-algebra', 'calculus', 'machine-learning')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'supervised-learning' AND s2.slug IN ('python', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'regression' AND s2.slug IN ('supervised-learning', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'classification' AND s2.slug IN ('supervised-learning', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'clustering' AND s2.slug IN ('unsupervised-learning', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'unsupervised-learning' AND s2.slug IN ('python', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'pandas' AND s2.slug IN ('python')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'numpy' AND s2.slug IN ('python')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'feature-engineering' AND s2.slug IN ('pandas', 'numpy', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'model-evaluation' AND s2.slug IN ('supervised-learning', 'statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'data-preprocessing' AND s2.slug IN ('pandas', 'numpy')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'probability' AND s2.slug IN ('statistics')
ON CONFLICT DO NOTHING;

INSERT INTO skill_prerequisites (skill_id, prerequisite_id)
SELECT s1.id, s2.id FROM skills s1, skills s2
WHERE s1.slug = 'data-visualization' AND s2.slug IN ('pandas')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LESSONS
-- ============================================================================
INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Python Fundamentals', 'Variables, data types, control flow, functions',
  ARRAY['Understand Python syntax and data types', 'Write functions and control structures', 'Use lists, dicts, and tuples'],
  'Python is a high-level programming language. This lesson covers variables, data types (int, float, str, bool), control flow (if/else, for/while loops), functions, and basic data structures (lists, dictionaries, tuples, sets).',
  45, 'beginner', ARRAY[]::text[]
FROM skills WHERE slug = 'python'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Python Object-Oriented Programming', 'Classes, objects, inheritance, polymorphism',
  ARRAY['Define classes and create objects', 'Understand inheritance and polymorphism', 'Use dunder methods'],
  'OOP in Python: classes, __init__, instance vs class methods, inheritance, super(), encapsulation, and polymorphism.',
  40, 'intermediate', ARRAY['Python Fundamentals']
FROM skills WHERE slug = 'python'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Descriptive Statistics', 'Mean, median, mode, variance, standard deviation',
  ARRAY['Calculate measures of central tendency', 'Calculate measures of spread', 'Interpret statistical summaries'],
  'Descriptive statistics summarize data: mean (average), median (middle value), mode (most frequent), variance (spread from mean), standard deviation (square root of variance), quartiles, and percentiles.',
  35, 'beginner', ARRAY[]::text[]
FROM skills WHERE slug = 'statistics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Inferential Statistics', 'Hypothesis testing, p-values, confidence intervals',
  ARRAY['Understand hypothesis testing', 'Interpret p-values and confidence intervals', 'Apply t-tests and chi-square tests'],
  'Inferential statistics draws conclusions about populations from samples. Covers null/alternative hypotheses, p-values, significance level alpha, confidence intervals, t-tests, ANOVA, and chi-square tests.',
  45, 'intermediate', ARRAY['Descriptive Statistics']
FROM skills WHERE slug = 'statistics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Introduction to Machine Learning', 'What is ML? Types of learning, the ML workflow',
  ARRAY['Define machine learning and its types', 'Understand the ML workflow', 'Distinguish supervised vs unsupervised learning'],
  'Machine Learning is the science of programming computers to learn from data. Types: supervised (labeled data), unsupervised (unlabeled), reinforcement (reward-based). The ML workflow: data collection, preprocessing, model selection, training, evaluation, deployment.',
  40, 'intermediate', ARRAY['Python Fundamentals', 'Descriptive Statistics']
FROM skills WHERE slug = 'machine-learning'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'SQL Basics', 'SELECT, WHERE, JOIN, GROUP BY, aggregation',
  ARRAY['Write basic SELECT queries', 'Use WHERE and ORDER BY', 'Perform JOINs and aggregations'],
  'SQL (Structured Query Language) manages relational databases. Key commands: SELECT (query data), WHERE (filter), JOIN (combine tables), GROUP BY (aggregate), ORDER BY (sort), and aggregate functions (COUNT, SUM, AVG, MIN, MAX).',
  35, 'beginner', ARRAY[]::text[]
FROM skills WHERE slug = 'sql'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Data Structures Overview', 'Arrays, linked lists, stacks, queues, trees, hash maps',
  ARRAY['Understand common data structures', 'Choose appropriate structures for problems', 'Analyze time complexity'],
  'Data structures organize data efficiently: arrays (indexed access), linked lists (sequential), stacks (LIFO), queues (FIFO), trees (hierarchical), hash maps (key-value), graphs (networked). Time complexity: O(1), O(n), O(log n), O(n^2).',
  50, 'beginner', ARRAY[]::text[]
FROM skills WHERE slug = 'data-structures'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Calculus for ML', 'Derivatives, gradients, partial derivatives, chain rule',
  ARRAY['Understand derivatives and their geometric meaning', 'Compute gradients', 'Apply the chain rule for backpropagation'],
  'Calculus is essential for ML optimization. Derivatives measure rate of change. Gradients are vectors of partial derivatives. The chain rule enables backpropagation in neural networks. Gradient descent uses derivatives to minimize loss.',
  50, 'intermediate', ARRAY[]::text[]
FROM skills WHERE slug = 'calculus'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Linear Algebra Foundations', 'Vectors, matrices, matrix operations, eigenvalues',
  ARRAY['Perform vector and matrix operations', 'Understand linear transformations', 'Compute eigenvalues and eigenvectors'],
  'Linear algebra underpins ML. Vectors (magnitude + direction), matrices (2D arrays), operations (addition, multiplication, transpose), dot product, determinants, inverse matrices, eigenvalues/eigenvectors (used in PCA, SVD).',
  50, 'intermediate', ARRAY[]::text[]
FROM skills WHERE slug = 'linear-algebra'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Probability Theory', 'Distributions, Bayes theorem, random variables',
  ARRAY['Understand probability distributions', 'Apply Bayes theorem', 'Work with random variables'],
  'Probability theory: sample space, events, conditional probability, Bayes theorem P(A|B) = P(B|A)*P(A)/P(B), random variables (discrete/continuous), distributions (uniform, normal, binomial, Poisson), expected value, variance.',
  45, 'intermediate', ARRAY['Descriptive Statistics']
FROM skills WHERE slug = 'probability'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Pandas for Data Analysis', 'DataFrames, indexing, groupby, merging',
  ARRAY['Create and manipulate DataFrames', 'Use groupby and aggregation', 'Merge and join datasets'],
  'Pandas is the primary data analysis library in Python. DataFrames (tabular data), Series (1D), indexing (loc/iloc), filtering, groupby (split-apply-combine), merge/join, handling missing data, time series.',
  40, 'beginner', ARRAY['Python Fundamentals']
FROM skills WHERE slug = 'pandas'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'NumPy Arrays', 'Array creation, indexing, broadcasting, vectorized operations',
  ARRAY['Create and manipulate NumPy arrays', 'Understand broadcasting', 'Use vectorized operations for performance'],
  'NumPy provides efficient n-dimensional arrays. Array creation (np.array, zeros, ones, arange), indexing/slicing, broadcasting (operating on different-shaped arrays), vectorized operations (faster than Python loops), linear algebra functions.',
  35, 'beginner', ARRAY['Python Fundamentals']
FROM skills WHERE slug = 'numpy'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Deep Learning Fundamentals', 'Neural networks, backpropagation, activation functions',
  ARRAY['Understand neural network architecture', 'Explain backpropagation', 'Choose activation functions'],
  'Deep learning uses multi-layer neural networks. Architecture: input layer, hidden layers, output layer. Forward pass computes predictions. Backpropagation computes gradients via chain rule. Activation functions: ReLU, sigmoid, tanh, softmax. Loss functions: MSE, cross-entropy.',
  55, 'advanced', ARRAY['Introduction to Machine Learning', 'Calculus for ML', 'Linear Algebra Foundations']
FROM skills WHERE slug = 'deep-learning'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Neural Network Architectures', 'CNNs, RNNs, transformers, and their applications',
  ARRAY['Understand CNN architecture for images', 'Understand RNN for sequences', 'Compare transformer architecture'],
  'Neural network architectures: CNNs (convolutional layers for image processing), RNNs/LSTMs (sequential data, memory), Transformers (attention mechanism, parallel processing). Transfer learning uses pre-trained models.',
  55, 'advanced', ARRAY['Deep Learning Fundamentals']
FROM skills WHERE slug = 'neural-networks'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Data Preprocessing Techniques', 'Cleaning, normalization, encoding, feature scaling',
  ARRAY['Handle missing values', 'Encode categorical variables', 'Scale and normalize features'],
  'Data preprocessing prepares raw data for ML. Handling missing values (imputation, deletion), encoding categorical data (one-hot, label encoding), feature scaling (min-max, standardization), handling outliers, train/test split.',
  40, 'beginner', ARRAY['Pandas for Data Analysis', 'NumPy Arrays']
FROM skills WHERE slug = 'data-preprocessing'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Model Evaluation and Validation', 'Cross-validation, metrics, overfitting, bias-variance tradeoff',
  ARRAY['Apply cross-validation', 'Choose appropriate evaluation metrics', 'Identify and prevent overfitting'],
  'Model evaluation: train/validation/test split, k-fold cross-validation. Classification metrics: accuracy, precision, recall, F1-score, ROC-AUC. Regression metrics: MSE, RMSE, MAE, R-squared. Overfitting: regularization, early stopping. Bias-variance tradeoff.',
  45, 'intermediate', ARRAY['Introduction to Machine Learning']
FROM skills WHERE slug = 'model-evaluation'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Feature Engineering', 'Creating, transforming, and selecting features',
  ARRAY['Create informative features', 'Apply feature transformation', 'Select relevant features'],
  'Feature engineering improves model performance. Techniques: polynomial features, interaction features, binning, log transformation, feature selection (correlation, mutual information, RFE), dimensionality reduction (PCA).',
  40, 'intermediate', ARRAY['Pandas for Data Analysis', 'Descriptive Statistics']
FROM skills WHERE slug = 'feature-engineering'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Supervised Learning Algorithms', 'Linear regression, logistic regression, decision trees, SVM, KNN',
  ARRAY['Implement linear and logistic regression', 'Apply decision trees and SVM', 'Use KNN for classification'],
  'Supervised learning with labeled data. Linear regression (continuous output), logistic regression (binary classification), decision trees (rule-based), random forests (ensemble), SVM (margin maximization), KNN (distance-based).',
  50, 'intermediate', ARRAY['Introduction to Machine Learning']
FROM skills WHERE slug = 'supervised-learning'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Unsupervised Learning', 'K-means, hierarchical clustering, PCA, t-SNE',
  ARRAY['Apply K-means clustering', 'Use hierarchical clustering', 'Reduce dimensions with PCA'],
  'Unsupervised learning finds patterns in unlabeled data. K-means (centroid-based clustering), hierarchical clustering (dendrogram), DBSCAN (density-based), PCA (linear dimensionality reduction), t-SNE (nonlinear visualization).',
  45, 'intermediate', ARRAY['Introduction to Machine Learning']
FROM skills WHERE slug = 'unsupervised-learning'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Regression Analysis', 'Linear, polynomial, ridge, lasso regression',
  ARRAY['Implement linear regression', 'Apply regularization with ridge/lasso', 'Interpret regression coefficients'],
  'Regression predicts continuous values. Linear regression (least squares), polynomial regression (nonlinear), ridge regression (L2 regularization), lasso regression (L1, feature selection), elastic net (combination). Assumptions: linearity, independence, homoscedasticity.',
  40, 'intermediate', ARRAY['Supervised Learning Algorithms']
FROM skills WHERE slug = 'regression'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Classification Methods', 'Decision trees, random forests, SVM, naive Bayes, gradient boosting',
  ARRAY['Build decision tree classifiers', 'Apply ensemble methods', 'Compare classifier performance'],
  'Classification predicts discrete labels. Decision trees (Gini/entropy), random forests (bagging), SVM (kernel trick), naive Bayes (probabilistic), gradient boosting (sequential correction), XGBoost/LightGBM (efficient implementations).',
  45, 'intermediate', ARRAY['Supervised Learning Algorithms']
FROM skills WHERE slug = 'classification'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Clustering Algorithms', 'K-means, DBSCAN, hierarchical clustering, Gaussian mixtures',
  ARRAY['Implement K-means clustering', 'Apply DBSCAN for density-based clustering', 'Evaluate clustering quality'],
  'Clustering groups similar data points. K-means (minimize within-cluster variance), DBSCAN (density-based, handles noise), hierarchical (agglomerative/divisive), Gaussian mixture models (probabilistic). Evaluation: silhouette score, elbow method.',
  40, 'intermediate', ARRAY['Unsupervised Learning']
FROM skills WHERE slug = 'clustering'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Git Version Control', 'Repositories, commits, branches, merges, pull requests',
  ARRAY['Initialize and clone repositories', 'Commit and branch changes', 'Merge and resolve conflicts'],
  'Git tracks code changes. Commands: init, clone, add, commit, push, pull, branch, merge. Branching enables parallel development. Pull requests facilitate code review. .gitignore excludes files. Best practices: atomic commits, meaningful messages.',
  30, 'beginner', ARRAY[]::text[]
FROM skills WHERE slug = 'git'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (skill_id, title, description, objectives, content, estimated_minutes, difficulty, prerequisites)
SELECT id, 'Data Visualization', 'Matplotlib, Seaborn, chart types, storytelling with data',
  ARRAY['Create charts with Matplotlib', 'Use Seaborn for statistical plots', 'Choose appropriate chart types'],
  'Data visualization communicates insights. Matplotlib (flexible, low-level), Seaborn (statistical, high-level). Chart types: bar, line, scatter, histogram, box plot, heatmap. Principles: clarity, accuracy, appropriate scales, color choice, annotations.',
  35, 'beginner', ARRAY['Pandas for Data Analysis']
FROM skills WHERE slug = 'data-visualization'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ASSESSMENT QUESTIONS
-- ============================================================================

-- Python questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which Python data type is used to store an ordered, mutable collection of items?',
  ARRAY['tuple', 'list', 'set', 'frozenset'],
  'list', 'A list is ordered and mutable. Tuples are immutable, sets are unordered.', 'beginner'
FROM skills WHERE slug = 'python' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'In Python, dictionaries maintain insertion order as of Python 3.7+.',
  ARRAY['True', 'False'],
  'True', 'As of Python 3.7, dictionaries preserve insertion order as an implementation detail, and it is guaranteed in Python 3.7+.', 'beginner'
FROM skills WHERE slug = 'python' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What does the super() function do in Python?',
  ARRAY['Returns the parent class instance', 'Calls a method from the parent class', 'Creates a new class', 'Imports a module'],
  'Calls a method from the parent class',
  'super() returns a proxy object that delegates method calls to the parent or sibling class, used in inheritance.', 'intermediate'
FROM skills WHERE slug = 'python' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which of the following is NOT a Python built-in data structure?',
  ARRAY['list', 'dict', 'array', 'set'],
  'array', 'The array type is not built-in; it requires importing the array module. lists, dicts, and sets are built-in.', 'beginner'
FROM skills WHERE slug = 'python' ON CONFLICT DO NOTHING;

-- Statistics questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which measure of central tendency is most affected by outliers?',
  ARRAY['Mean', 'Median', 'Mode', 'Range'],
  'Mean', 'The mean is sensitive to outliers because it factors in every value. The median and mode are resistant to outliers.', 'beginner'
FROM skills WHERE slug = 'statistics' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'A p-value less than 0.05 always means the null hypothesis is false.',
  ARRAY['True', 'False'],
  'False', 'A p-value < 0.05 indicates evidence against the null hypothesis, but does not prove it is false. It means the observed result would be unlikely if the null were true.', 'intermediate'
FROM skills WHERE slug = 'statistics' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What does standard deviation measure?',
  ARRAY['Average value of data', 'Spread of data around the mean', 'Difference between max and min', 'Most frequent value'],
  'Spread of data around the mean',
  'Standard deviation quantifies how dispersed the data is from the mean. A low SD means data is close to the mean.', 'beginner'
FROM skills WHERE slug = 'statistics' ON CONFLICT DO NOTHING;

-- Machine Learning questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which type of machine learning uses labeled training data?',
  ARRAY['Unsupervised learning', 'Supervised learning', 'Reinforcement learning', 'Transfer learning'],
  'Supervised learning',
  'Supervised learning trains on labeled data (input-output pairs) to learn a mapping function.', 'intermediate'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What is overfitting in machine learning?',
  ARRAY['Model performs well on training data but poorly on new data', 'Model performs poorly on all data', 'Model has too few parameters', 'Model uses the wrong algorithm'],
  'Model performs well on training data but poorly on new data',
  'Overfitting occurs when a model learns the training data too closely, including noise, failing to generalize to unseen data.', 'intermediate'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'Cross-validation helps detect overfitting by evaluating the model on multiple train-test splits.',
  ARRAY['True', 'False'],
  'True', 'Cross-validation divides data into multiple folds, training and evaluating on different combinations, providing a more robust estimate of generalization performance.', 'intermediate'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which algorithm is best suited for predicting a continuous numerical value?',
  ARRAY['K-means clustering', 'Linear regression', 'Logistic regression', 'Decision tree classification'],
  'Linear regression',
  'Linear regression predicts continuous values by fitting a linear relationship between features and the target variable.', 'intermediate'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT DO NOTHING;

-- SQL questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which SQL clause is used to filter rows in a query?',
  ARRAY['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING'],
  'WHERE', 'The WHERE clause filters individual rows before grouping. HAVING filters groups after GROUP BY.', 'beginner'
FROM skills WHERE slug = 'sql' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'A LEFT JOIN returns all rows from the left table and matching rows from the right table.',
  ARRAY['True', 'False'],
  'True', 'A LEFT JOIN (left outer join) returns all records from the left table and matched records from the right table. Unmatched right columns are NULL.', 'beginner'
FROM skills WHERE slug = 'sql' ON CONFLICT DO NOTHING;

-- Data Structures questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What is the time complexity of accessing an element in a hash map (on average)?',
  ARRAY['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
  'O(1)', 'Hash maps provide average O(1) lookup time because the hash function directly computes the storage location.', 'beginner'
FROM skills WHERE slug = 'data-structures' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which data structure uses LIFO (Last In, First Out) ordering?',
  ARRAY['Queue', 'Stack', 'Linked List', 'Binary Tree'],
  'Stack', 'A stack follows LIFO order: the last element added is the first removed (push and pop operations).', 'beginner'
FROM skills WHERE slug = 'data-structures' ON CONFLICT DO NOTHING;

-- Calculus questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What does a derivative represent geometrically?',
  ARRAY['Area under the curve', 'Slope of the tangent line at a point', 'Average value of a function', 'Maximum value of a function'],
  'Slope of the tangent line at a point',
  'The derivative of a function at a point gives the slope of the tangent line, representing the instantaneous rate of change.', 'intermediate'
FROM skills WHERE slug = 'calculus' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'Gradient descent uses derivatives to minimize a loss function.',
  ARRAY['True', 'False'],
  'True', 'Gradient descent iteratively moves in the direction of the negative gradient (derivative) to minimize the loss function.', 'intermediate'
FROM skills WHERE slug = 'calculus' ON CONFLICT DO NOTHING;

-- Linear Algebra questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'The result of multiplying a 3x2 matrix by a 2x4 matrix is a matrix of what size?',
  ARRAY['2x3', '3x4', '2x2', '4x3'],
  '3x4', 'Matrix multiplication: (m x n) * (n x p) = (m x p). So (3x2) * (2x4) = (3x4).', 'intermediate'
FROM skills WHERE slug = 'linear-algebra' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What are eigenvalues?',
  ARRAY['Vectors that do not change direction under a transformation', 'Scalars that scale eigenvectors under a transformation', 'The determinant of a matrix', 'The trace of a matrix'],
  'Scalars that scale eigenvectors under a transformation',
  'For Av = λv, λ is the eigenvalue (scalar) and v is the eigenvector. The transformation only scales the eigenvector by λ.', 'intermediate'
FROM skills WHERE slug = 'linear-algebra' ON CONFLICT DO NOTHING;

-- Probability questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Bayes theorem relates which quantities?',
  ARRAY['P(A|B), P(B|A), P(A), P(B)', 'P(A and B) only', 'P(A or B) only', 'P(A) and P(B) only'],
  'P(A|B), P(B|A), P(A), P(B)',
  'Bayes theorem: P(A|B) = P(B|A) * P(A) / P(B). It updates the probability of A given evidence B.', 'intermediate'
FROM skills WHERE slug = 'probability' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'The sum of probabilities of all outcomes in a probability distribution always equals 1.',
  ARRAY['True', 'False'],
  'True', 'In any valid probability distribution, the probabilities of all possible outcomes must sum to 1.', 'intermediate'
FROM skills WHERE slug = 'probability' ON CONFLICT DO NOTHING;

-- Deep Learning questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which activation function outputs values between 0 and 1?',
  ARRAY['ReLU', 'Tanh', 'Sigmoid', 'Leaky ReLU'],
  'Sigmoid', 'The sigmoid function σ(x) = 1/(1+e^-x) squashes input to (0, 1), making it useful for binary classification output.', 'advanced'
FROM skills WHERE slug = 'deep-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What is the purpose of backpropagation?',
  ARRAY['Initialize network weights', 'Compute gradients of the loss with respect to weights', 'Choose the activation function', 'Normalize input data'],
  'Compute gradients of the loss with respect to weights',
  'Backpropagation applies the chain rule to compute gradients of the loss function with respect to each weight, enabling gradient-based optimization.', 'advanced'
FROM skills WHERE slug = 'deep-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'The ReLU activation function can cause the "dying ReLU" problem where neurons stop learning.',
  ARRAY['True', 'False'],
  'True', 'ReLU outputs 0 for negative inputs. If a neuron consistently receives negative inputs, its gradient is 0 and it stops learning (dying ReLU).', 'advanced'
FROM skills WHERE slug = 'deep-learning' ON CONFLICT DO NOTHING;

-- Model Evaluation questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which metric is most appropriate for evaluating a model on a highly imbalanced dataset?',
  ARRAY['Accuracy', 'F1-score', 'Mean squared error', 'R-squared'],
  'F1-score', 'On imbalanced datasets, accuracy can be misleading. F1-score (harmonic mean of precision and recall) is more informative for the minority class.', 'intermediate'
FROM skills WHERE slug = 'model-evaluation' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What does the bias-variance tradeoff describe?',
  ARRAY['The tradeoff between model speed and accuracy', 'The tradeoff between underfitting and overfitting', 'The tradeoff between training and inference time', 'The tradeoff between features and samples'],
  'The tradeoff between underfitting and overfitting',
  'High bias leads to underfitting (too simple), high variance leads to overfitting (too complex). The tradeoff is finding the right model complexity.', 'intermediate'
FROM skills WHERE slug = 'model-evaluation' ON CONFLICT DO NOTHING;

-- Supervised Learning questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which algorithm is NOT a supervised learning algorithm?',
  ARRAY['Linear Regression', 'K-Means Clustering', 'Random Forest', 'Support Vector Machine'],
  'K-Means Clustering',
  'K-Means is an unsupervised learning algorithm — it clusters unlabeled data. The others require labeled training data.', 'intermediate'
FROM skills WHERE slug = 'supervised-learning' ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'true_false',
  'Logistic regression can be used for multi-class classification.',
  ARRAY['True', 'False'],
  'True', 'While inherently binary, logistic regression extends to multi-class via softmax (multinomial logistic regression) or one-vs-rest strategies.', 'intermediate'
FROM skills WHERE slug = 'supervised-learning' ON CONFLICT DO NOTHING;

-- Feature Engineering questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'What is one-hot encoding used for?',
  ARRAY['Scaling numerical features', 'Converting categorical variables to numerical format', 'Reducing dimensionality', 'Handling missing values'],
  'Converting categorical variables to numerical format',
  'One-hot encoding creates binary columns for each category, allowing categorical variables to be used in ML models.', 'intermediate'
FROM skills WHERE slug = 'feature-engineering' ON CONFLICT DO NOTHING;

-- Pandas questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'In Pandas, which method is used to group data for aggregation?',
  ARRAY['groupby()', 'aggregate()', 'merge()', 'pivot()'],
  'groupby()',
  'groupby() splits data into groups, applies a function, and combines results (split-apply-combine pattern).', 'beginner'
FROM skills WHERE slug = 'pandas' ON CONFLICT DO NOTHING;

-- Data Visualization questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'Which chart type is best for showing the distribution of a single continuous variable?',
  ARRAY['Bar chart', 'Histogram', 'Scatter plot', 'Pie chart'],
  'Histogram',
  'A histogram bins a continuous variable and shows frequency, revealing the distribution shape (normal, skewed, bimodal).', 'beginner'
FROM skills WHERE slug = 'data-visualization' ON CONFLICT DO NOTHING;

-- Clustering questions
INSERT INTO assessment_questions (skill_id, question_type, question, options, correct_answer, explanation, difficulty)
SELECT id, 'multiple_choice',
  'How do you choose the optimal number of clusters in K-means?',
  ARRAY['Use the elbow method', 'Always use k=3', 'Use the highest silhouette score', 'Both elbow method and silhouette score'],
  'Both elbow method and silhouette score',
  'The elbow method looks at the within-cluster sum of squares vs k. The silhouette score measures clustering quality. Both are valid approaches.', 'intermediate'
FROM skills WHERE slug = 'clustering' ON CONFLICT DO NOTHING;

-- ============================================================================
-- RESOURCES (internal — no external URLs)
-- ============================================================================

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'python-basics-guide', 'Python Basics: A Comprehensive Guide', 'Learn Python syntax, data types, and control flow from scratch', 'documentation',
  id, 'beginner', ARRAY['reading', 'visual'], ARRAY['python', 'programming', 'basics'], 30, true,
  'A comprehensive guide to Python basics covering variables, data types (int, float, str, bool, list, dict, tuple, set), control flow (if/else, for, while), functions, and basic error handling. Includes code examples and exercises.'
FROM skills WHERE slug = 'python' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'python-practice-exercises', 'Python Practice Exercises', '20 hands-on Python exercises to build programming fluency', 'practice',
  id, 'beginner', ARRAY['hands_on', 'project_based'], ARRAY['python', 'exercises', 'practice'], 45, true,
  'A set of 20 graduated Python exercises: from simple variable manipulation to functions, loops, and basic data structures. Each exercise includes a problem statement and hints.'
FROM skills WHERE slug = 'python' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'stats-visual-guide', 'Statistics: A Visual Guide', 'Visual explanations of mean, median, variance, and distributions', 'article',
  id, 'beginner', ARRAY['visual', 'reading'], ARRAY['statistics', 'descriptive', 'visual'], 20, true,
  'An illustrated guide to descriptive statistics with visual diagrams showing how mean, median, and mode differ, how variance spreads data, and what different distributions look like.'
FROM skills WHERE slug = 'statistics' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'ml-intro-quiz', 'Machine Learning Concepts Quiz', 'Test your understanding of core ML concepts', 'quiz',
  id, 'intermediate', ARRAY['hands_on', 'reading'], ARRAY['machine-learning', 'quiz', 'concepts'], 15, true,
  'A quiz covering ML fundamentals: types of learning, the ML workflow, overfitting, cross-validation, and common algorithms. 10 questions with explanations.'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'ml-workflow-project', 'End-to-End ML Project', 'Build a complete ML pipeline from data to deployment', 'project',
  id, 'intermediate', ARRAY['project_based', 'hands_on'], ARRAY['machine-learning', 'project', 'workflow'], 120, true,
  'A guided end-to-end ML project: data collection, preprocessing, exploratory analysis, model selection, training, evaluation, and deployment. Covers the complete ML workflow with code examples.'
FROM skills WHERE slug = 'machine-learning' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'sql-interactive-tutorial', 'SQL Interactive Tutorial', 'Learn SQL with hands-on query exercises', 'course',
  id, 'beginner', ARRAY['hands_on', 'reading'], ARRAY['sql', 'database', 'queries'], 40, true,
  'An interactive SQL tutorial covering SELECT, WHERE, JOIN, GROUP BY, and subqueries. Includes a sample database schema and progressive exercises.'
FROM skills WHERE slug = 'sql' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'data-structures-visual', 'Data Structures Visualized', 'Visual walkthrough of arrays, trees, hash maps, and graphs', 'article',
  id, 'beginner', ARRAY['visual', 'reading'], ARRAY['data-structures', 'algorithms', 'visual'], 25, true,
  'Visual representations of common data structures with step-by-step operations on each. Includes complexity comparisons and use case recommendations.'
FROM skills WHERE slug = 'data-structures' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'calculus-for-ml-exercises', 'Calculus for ML: Practice Problems', 'Gradient computation and optimization exercises', 'practice',
  id, 'intermediate', ARRAY['hands_on', 'reading'], ARRAY['calculus', 'derivatives', 'gradients'], 35, true,
  'Practice problems computing derivatives, partial derivatives, and gradients. Includes problems on the chain rule and its application to backpropagation.'
FROM skills WHERE slug = 'calculus' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'linear-algebra-matrix-ops', 'Linear Algebra: Matrix Operations', 'Hands-on matrix operations and transformations', 'practice',
  id, 'intermediate', ARRAY['hands_on', 'visual'], ARRAY['linear-algebra', 'matrices', 'vectors'], 30, true,
  'Practice exercises on matrix multiplication, transpose, inverse, determinants, and eigenvalue decomposition. Includes visual explanations of linear transformations.'
FROM skills WHERE slug = 'linear-algebra' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'pandas-cookbook', 'Pandas Cookbook', 'Common data manipulation patterns with Pandas', 'documentation',
  id, 'beginner', ARRAY['reading', 'hands_on'], ARRAY['pandas', 'data-analysis', 'python'], 35, true,
  'A collection of common Pandas patterns: filtering, groupby, merging, handling missing data, time series operations, and data cleaning. Each pattern includes a code example.'
FROM skills WHERE slug = 'pandas' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'numpy-array-guide', 'NumPy Array Operations Guide', 'Master NumPy arrays, broadcasting, and vectorization', 'documentation',
  id, 'beginner', ARRAY['reading', 'visual'], ARRAY['numpy', 'arrays', 'numerical'], 25, true,
  'A guide to NumPy array creation, indexing, slicing, broadcasting rules, and vectorized operations. Includes performance comparisons with pure Python.'
FROM skills WHERE slug = 'numpy' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'deep-learning-architectures', 'Deep Learning Architectures Overview', 'Comparing CNN, RNN, and Transformer architectures', 'article',
  id, 'advanced', ARRAY['reading', 'visual'], ARRAY['deep-learning', 'neural-networks', 'architecture'], 40, true,
  'An overview of major deep learning architectures: CNNs for images, RNNs/LSTMs for sequences, and Transformers for attention-based processing. Includes architecture diagrams and use cases.'
FROM skills WHERE slug = 'deep-learning' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'neural-network-from-scratch', 'Build a Neural Network from Scratch', 'Implement a neural network in pure Python', 'project',
  id, 'advanced', ARRAY['project_based', 'hands_on'], ARRAY['neural-networks', 'python', 'from-scratch'], 90, true,
  'Build a simple neural network from scratch using only NumPy. Covers forward pass, backpropagation, activation functions, and training loop. Deepens understanding of how neural networks work internally.'
FROM skills WHERE slug = 'neural-networks' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'data-preprocessing-guide', 'Data Preprocessing Complete Guide', 'Cleaning, encoding, scaling, and feature preparation', 'documentation',
  id, 'beginner', ARRAY['reading', 'hands_on'], ARRAY['preprocessing', 'data-cleaning', 'encoding'], 30, true,
  'A comprehensive guide to data preprocessing: handling missing values, categorical encoding (one-hot, label, target), feature scaling (standardization, min-max), outlier detection, and train/test splitting strategies.'
FROM skills WHERE slug = 'data-preprocessing' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'model-evaluation-metrics', 'Model Evaluation Metrics Explained', 'Understanding accuracy, precision, recall, F1, ROC-AUC', 'article',
  id, 'intermediate', ARRAY['reading', 'visual'], ARRAY['evaluation', 'metrics', 'validation'], 25, true,
  'Detailed explanation of classification metrics (accuracy, precision, recall, F1, ROC-AUC) and regression metrics (MSE, RMSE, MAE, R2). Includes confusion matrix visualization and cross-validation strategies.'
FROM skills WHERE slug = 'model-evaluation' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'feature-engineering-techniques', 'Feature Engineering Techniques', 'Creating, transforming, and selecting features', 'course',
  id, 'intermediate', ARRAY['reading', 'hands_on', 'project_based'], ARRAY['feature-engineering', 'features', 'transformation'], 50, true,
  'A course on feature engineering: polynomial features, interaction features, binning, log transforms, feature selection (correlation, mutual information, RFE), and dimensionality reduction (PCA).'
FROM skills WHERE slug = 'feature-engineering' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'supervised-learning-practice', 'Supervised Learning Practice Set', 'Implement regression and classification models', 'practice',
  id, 'intermediate', ARRAY['hands_on', 'project_based'], ARRAY['supervised-learning', 'regression', 'classification'], 60, true,
  'Practice set implementing linear regression, logistic regression, decision trees, and SVM on real datasets. Includes model comparison and hyperparameter tuning exercises.'
FROM skills WHERE slug = 'supervised-learning' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'unsupervised-learning-project', 'Unsupervised Learning Mini-Project', 'Cluster customer segments and reduce dimensions', 'project',
  id, 'intermediate', ARRAY['project_based', 'hands_on'], ARRAY['unsupervised', 'clustering', 'pca'], 75, true,
  'A mini-project applying K-means and hierarchical clustering to customer segmentation data, with PCA for dimensionality reduction and visualization. Includes evaluation with silhouette scores.'
FROM skills WHERE slug = 'unsupervised-learning' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'regression-analysis-exercises', 'Regression Analysis Exercises', 'Practice linear, ridge, and lasso regression', 'practice',
  id, 'intermediate', ARRAY['hands_on', 'reading'], ARRAY['regression', 'linear', 'regularization'], 40, true,
  'Exercises implementing linear, polynomial, ridge, and lasso regression. Includes coefficient interpretation, regularization comparison, and residual analysis.'
FROM skills WHERE slug = 'regression' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'classification-methods-quiz', 'Classification Methods Quiz', 'Test knowledge of decision trees, SVM, and ensemble methods', 'quiz',
  id, 'intermediate', ARRAY['hands_on', 'reading'], ARRAY['classification', 'quiz', 'ensemble'], 15, true,
  'A quiz on classification algorithms: decision trees, random forests, SVM, naive Bayes, and gradient boosting. 10 questions with explanations covering algorithm selection and evaluation.'
FROM skills WHERE slug = 'classification' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'clustering-algorithms-guide', 'Clustering Algorithms Guide', 'K-means, DBSCAN, and hierarchical clustering explained', 'documentation',
  id, 'intermediate', ARRAY['reading', 'visual'], ARRAY['clustering', 'k-means', 'dbscan'], 30, true,
  'A guide to clustering algorithms: K-means (centroid-based), DBSCAN (density-based), hierarchical (agglomerative), and Gaussian mixtures. Includes evaluation methods: silhouette score, elbow method, and Davies-Bouldin index.'
FROM skills WHERE slug = 'clustering' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'git-version-control-basics', 'Git Version Control Basics', 'Master repositories, branches, and collaboration', 'course',
  id, 'beginner', ARRAY['reading', 'hands_on'], ARRAY['git', 'version-control', 'collaboration'], 25, true,
  'A course on Git: repository initialization, staging and committing, branching strategies, merging and conflict resolution, pull requests, and best practices for collaboration.'
FROM skills WHERE slug = 'git' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'data-viz-with-python', 'Data Visualization with Python', 'Creating effective charts with Matplotlib and Seaborn', 'course',
  id, 'beginner', ARRAY['visual', 'hands_on'], ARRAY['visualization', 'matplotlib', 'seaborn'], 40, true,
  'A course on data visualization using Matplotlib and Seaborn. Covers bar charts, line plots, scatter plots, heatmaps, and statistical plots. Includes principles of effective visual communication.'
FROM skills WHERE slug = 'data-visualization' ON CONFLICT (slug) DO NOTHING;

INSERT INTO resources (slug, title, description, resource_type, skill_id, difficulty, learning_styles, tags, estimated_minutes, is_internal, content)
SELECT 'probability-bayes-practice', 'Probability and Bayes Theorem Practice', 'Practice problems on probability distributions and Bayes theorem', 'practice',
  id, 'intermediate', ARRAY['hands_on', 'reading'], ARRAY['probability', 'bayes', 'distributions'], 30, true,
  'Practice problems on probability: calculating probabilities, conditional probability, Bayes theorem applications, common distributions (normal, binomial, Poisson), and expected value calculations.'
FROM skills WHERE slug = 'probability' ON CONFLICT (slug) DO NOTHING;
