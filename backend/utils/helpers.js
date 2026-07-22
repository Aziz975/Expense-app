const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Bills',
  'Health', 'Education', 'Entertainment', 'Other',
];

// Build dynamic WHERE clause for search/filter queries
const buildFilterQuery = (baseQuery, filters, params) => {
  let query = baseQuery;
  const values = [...params];

  if (filters.search) {
    query += ' AND (description LIKE ? OR category LIKE ? OR CAST(amount AS CHAR) LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.category) {
    query += ' AND category = ?';
    values.push(filters.category);
  }

  if (filters.source) {
    query += ' AND source LIKE ?';
    values.push(`%${filters.source}%`);
  }

  if (filters.type) {
    // Handled at controller level for combined queries
  }

  if (filters.startDate) {
    query += ' AND date >= ?';
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ' AND date <= ?';
    values.push(filters.endDate);
  }

  if (filters.month) {
    query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
    values.push(filters.month);
  }

  return { query, values };
};

// Parse sort parameters safely
const parseSort = (sortBy, sortOrder, allowedFields) => {
  const field = allowedFields.includes(sortBy) ? sortBy : 'date';
  const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return { field, order };
};

module.exports = { EXPENSE_CATEGORIES, buildFilterQuery, parseSort };
