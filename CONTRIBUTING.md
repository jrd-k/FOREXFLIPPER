# Contributing to JRd-Trades

Thank you for your interest in contributing to JRd-Trades! This document provides guidelines for contributing to our forex trading system.

## Code of Conduct

- Be respectful and professional in all interactions
- Focus on constructive feedback and solutions
- Remember that trading involves real financial risk - test thoroughly
- Follow security best practices, especially with API keys and credentials

## How to Contribute

### Reporting Issues

1. **Security Issues**: Email security concerns privately rather than creating public issues
2. **Bug Reports**: Include:
   - Clear description of the problem
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Trading environment details (broker, account size, etc.)
   - Relevant logs or error messages

3. **Feature Requests**: Include:
   - Clear description of the proposed feature
   - Use case and business justification
   - How it fits with the existing architecture
   - Potential impact on risk management

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/jrd-trades.git`
3. Install dependencies: `npm install`
4. Set up your environment variables (copy `.env.example` to `.env`)
5. Initialize the database: `npm run db:push`
6. Start the development server: `npm run dev`

### Development Guidelines

#### Code Style
- Use TypeScript for all new code
- Follow the existing code structure and patterns
- Use meaningful variable and function names
- Add comments for complex trading logic
- Maintain consistent formatting with Prettier

#### Testing
- Add unit tests for new trading strategies
- Test risk management calculations thoroughly
- Use demo accounts for integration testing
- Never test with live trading accounts during development

#### Trading Strategy Development
- All new strategies must include:
  - Clear entry/exit conditions
  - Risk management parameters
  - Backtesting results (if available)
  - Documentation of market conditions where it works best

#### Risk Management
- Never bypass existing risk controls
- All position sizing must go through the risk manager
- New risk features require thorough testing
- Document any changes to safety mechanisms

### Pull Request Process

1. **Branch Naming**: Use descriptive names
   - `feature/new-strategy-name`
   - `fix/risk-calculation-bug`
   - `improvement/ui-dashboard-update`

2. **Commit Messages**: Use clear, descriptive messages
   ```
   feat: add RSI divergence strategy for trend reversal
   fix: correct position sizing calculation for small accounts
   docs: update README with new broker integration steps
   ```

3. **Pull Request Description**: Include:
   - Summary of changes
   - Testing performed
   - Impact on existing strategies
   - Screenshots for UI changes
   - Breaking changes (if any)

4. **Review Process**:
   - All PRs require at least one review
   - Trading strategy changes require extra scrutiny
   - Automated tests must pass
   - Manual testing verification required

### Architecture Considerations

#### Adding New Brokers
- Implement the `IBrokerConnector` interface
- Add comprehensive error handling
- Include connection retry logic
- Document API rate limits and restrictions

#### New Trading Strategies
- Extend the `TradingStrategy` base class
- Implement required methods: `shouldEnter`, `shouldExit`, `calculatePositionSize`
- Add strategy-specific configuration options
- Include market condition filters

#### Database Changes
- Use Drizzle migrations for schema changes
- Update TypeScript types accordingly
- Consider backward compatibility
- Test with existing data

#### Frontend Components
- Follow the existing component structure
- Use shadcn/ui components where possible
- Ensure responsive design
- Add appropriate loading states

### Security Guidelines

- Never commit API keys, passwords, or credentials
- Use environment variables for all sensitive data
- Validate all user inputs
- Implement proper authentication and authorization
- Regular security audits of dependencies

### Documentation

- Update README.md for significant features
- Add inline code comments for complex logic
- Document API changes
- Update configuration examples
- Include trading strategy explanations

### Testing Requirements

#### Unit Tests
- Test all trading calculations
- Mock external broker APIs
- Test edge cases and error conditions
- Maintain high code coverage

#### Integration Tests
- Test broker connections with demo accounts
- Verify database operations
- Test WebSocket connections
- End-to-end workflow testing

#### Manual Testing
- Test with multiple broker types
- Verify risk management under various scenarios
- UI/UX testing across different screen sizes
- Performance testing with multiple concurrent strategies

### Performance Considerations

- Optimize database queries
- Minimize API calls to brokers
- Efficient WebSocket message handling
- Memory management for long-running processes
- Consider latency in trading decisions

### Deployment

- Test in staging environment first
- Use feature flags for risky changes
- Monitor system performance after deployment
- Have rollback plan ready

## Questions or Need Help?

- Open an issue for general questions
- Join our Discord/Slack (if available)
- Review existing issues and pull requests
- Check the documentation and README

## Financial Disclaimer

Contributors acknowledge that:
- This software is for educational purposes
- Trading involves substantial financial risk
- Past performance doesn't guarantee future results
- Contributors are not liable for trading losses
- Always test with demo accounts first

Thank you for helping make JRd-Trades better and safer for forex traders!