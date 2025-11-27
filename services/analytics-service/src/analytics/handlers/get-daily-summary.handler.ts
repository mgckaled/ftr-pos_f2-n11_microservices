import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { GetDailySummaryQuery } from '../queries/get-daily-summary.query'
import { DailySalesSummary } from '../entities/daily-sales-summary.entity'

@QueryHandler(GetDailySummaryQuery)
export class GetDailySummaryHandler implements IQueryHandler<GetDailySummaryQuery> {
	constructor(
		@InjectRepository(DailySalesSummary)
		private dailySummaryRepository: Repository<DailySalesSummary>
	) {}

	async execute(query: GetDailySummaryQuery): Promise<DailySalesSummary[]> {
		const { startDate, endDate } = query

		const summaries = await this.dailySummaryRepository.find({
			where: {
				date: Between(startDate, endDate),
			},
			order: {
				date: 'DESC',
			},
		})

		return summaries
	}
}
