import { json } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import SDPay from '~/utils/SDPay.server';
import { requireAuth } from '~/middleware/auth.server';

export async function action({ request }: { request: Request }) {
  let userId;
  try {
    userId = await requireAuth(request);
  } catch (error) {
    return error as Response;
  }

  const { planId, billingCycle } = (await request.json()) as { planId: string; billingCycle: string };

  try {
    // 获取订阅计划详情
    const plan = await db('subscription_plans').where('_id', planId).first();
    if (!plan) {
      return json({ error: '无效的订阅计划' }, { status: 400 });
    }

    // 计算实际价格和代币数量
    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price;
    const tokens = billingCycle === 'yearly' ? plan.tokens * 12 : plan.tokens;

    // 创建 SDPay 实例
    const sdpay = new SDPay();

    // 生成订单号
    const orderNo = `sub_${Date.now()}_${userId}`;

    // 获取支付数据
    const paymentData = await sdpay.createPayment(
      orderNo,
      `${plan.name} 订阅 (${billingCycle === 'yearly' ? '年付' : '月付'})`,
      'alipay', // 或其他支付方式
      price, // 不用转换为分
      userId.toString(),
    );

    // 创建待处理的交易记录
    await db('user_transactions').insert({
      user_id: userId,
      type: 'subscription',
      plan_id: planId,
      amount: price,
      tokens: tokens,
      status: 'pending',
      payment_method: 'alipay', // 或其他支付方式
      transaction_id: orderNo,
    });

    return json({ success: true, paymentData: { ...paymentData, orderNo } });
  } catch (error) {
    console.error('初始化订阅购买时出错:', error);
    return json({ error: '初始化订阅购买失败' }, { status: 500 });
  }
}
